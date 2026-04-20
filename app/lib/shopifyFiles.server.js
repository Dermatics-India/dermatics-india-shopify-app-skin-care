// Uploads a file buffer to Shopify's Files CDN via stagedUploadsCreate + fileCreate,
// then polls the created File node until its public URL is available.
//
// Caller provides an `admin` GraphQL client obtained from
//   authenticate.admin(request)  or  unauthenticated.admin(shop)
export const uploadToShopify = async (admin, fileBuffer, fileName, fileMimeType) => {
  const stagedResp = await admin.graphql(
    `#graphql
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        userErrors { field message }
        stagedTargets {
          url
          resourceUrl
          parameters { name value }
        }
      }
    }`,
    {
      variables: {
        input: [
          {
            filename: fileName,
            mimeType: fileMimeType,
            httpMethod: "POST",
            resource: "IMAGE",
            fileSize: String(fileBuffer.length),
          },
        ],
      },
    },
  );

  const stagedJson = await stagedResp.json();
  const stagedPayload = stagedJson?.data?.stagedUploadsCreate;
  const stagedErrors = stagedPayload?.userErrors?.filter(Boolean) ?? [];
  if (stagedErrors.length) {
    throw new Error(
      stagedErrors.map((e) => e.message).join("; ") || "stagedUploadsCreate failed",
    );
  }

  const target = stagedPayload?.stagedTargets?.[0];
  if (!target?.url || !target?.resourceUrl) {
    throw new Error("Shopify did not return a staged upload target");
  }

  const formData = new FormData();
  target.parameters.forEach(({ name, value }) => formData.append(name, value));
  formData.append("file", new Blob([fileBuffer], { type: fileMimeType }), fileName);

  const stagedResponse = await fetch(target.url, { method: "POST", body: formData });
  if (!stagedResponse.ok) {
    const text = await stagedResponse.text().catch(() => "");
    throw new Error(
      `Staged upload failed (${stagedResponse.status}): ${text.slice(0, 200)}`,
    );
  }

  const createResp = await admin.graphql(
    `#graphql
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        userErrors { field message }
        files {
          ... on MediaImage {
            id
            image { url }
          }
          ... on GenericFile {
            id
            url
          }
        }
      }
    }`,
    {
      variables: {
        files: [
          { alt: fileName, contentType: "IMAGE", originalSource: target.resourceUrl },
        ],
      },
    },
  );

  const createJson = await createResp.json();
  const createPayload = createJson?.data?.fileCreate;
  const createErrors = createPayload?.userErrors?.filter(Boolean) ?? [];
  if (createErrors.length) {
    throw new Error(
      createErrors.map((e) => e.message).join("; ") || "fileCreate failed",
    );
  }

  const fileId = createPayload?.files?.[0]?.id;
  if (!fileId) throw new Error("No file ID returned from Shopify");

  let imageUrl = null;
  let attempts = 0;
  const maxAttempts = 5;

  while (!imageUrl && attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const pollResp = await admin.graphql(
      `#graphql
      query getFile($id: ID!) {
        node(id: $id) {
          ... on MediaImage {
            image { url }
          }
        }
      }`,
      { variables: { id: fileId } },
    );
    const pollJson = await pollResp.json();
    imageUrl = pollJson?.data?.node?.image?.url;
    attempts++;
  }

  if (!imageUrl) {
    throw new Error(
      "Image processing took too long. The file was created, but the URL is not ready yet. Please refresh in a moment.",
    );
  }

  return imageUrl;
};
