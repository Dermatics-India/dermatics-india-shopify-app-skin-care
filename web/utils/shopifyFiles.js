import shopify from "../shopify.js";

export const uploadToShopify = async (session, fileBuffer, fileName, fileMimeType) => {
  const client = new shopify.api.clients.Graphql({ session });

  const stagedUpload = await client.request(
    `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        userErrors { 
          field 
          message 
        }
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
    }
  );

  const stagedPayload = stagedUpload.data?.stagedUploadsCreate;
  const stagedErrors = stagedPayload?.userErrors?.filter(Boolean) ?? [];
  if (stagedErrors.length) {
    throw new Error(stagedErrors.map((e) => e.message).join("; ") || "stagedUploadsCreate failed");
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

  const fileCreate = await client.request(
    `mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        userErrors { field message }
        files {
          # Check for both types to ensure we get the ID
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
        files: [{ alt: fileName, contentType: "IMAGE", originalSource: target.resourceUrl }],
      },
    }
  );

  const createPayload = fileCreate.data?.fileCreate;
  const createErrors = createPayload?.userErrors?.filter(Boolean) ?? [];
  if (createErrors.length) {
    throw new Error(createErrors.map((e) => e.message).join("; ") || "fileCreate failed");
  }

  // 1. Get the File ID from the creation response
  const fileId = createPayload?.files?.[0]?.id;
  if (!fileId) throw new Error("No file ID returned from Shopify");

  let imageUrl = null;
  let attempts = 0;
  const maxAttempts = 5; // Total wait time: ~5-6 seconds

  // 2. Poll Shopify until the URL is generated
  while (!imageUrl && attempts < maxAttempts) {
    console.log(`Polling for image URL... Attempt ${attempts + 1}`);
    
    // Wait for 1 second before checking
    await new Promise(resolve => setTimeout(resolve, 1200));

    const pollResult = await client.request(
      `query getFile($id: ID!) {
        node(id: $id) {
          ... on MediaImage {
            image { url }
          }
        }
      }`,
      { variables: { id: fileId } }
    );

    imageUrl = pollResult.data?.node?.image?.url;
    attempts++;
  }

  if (!imageUrl) {
    throw new Error("Image processing took too long. The file was created, but the URL is not ready yet. Please refresh in a moment.");
  }

  return imageUrl;
};