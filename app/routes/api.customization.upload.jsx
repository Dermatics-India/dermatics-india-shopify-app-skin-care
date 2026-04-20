import {
  unstable_createMemoryUploadHandler,
  unstable_parseMultipartFormData,
} from "@remix-run/node";

import { authenticate } from "../shopify.server";
import { loadShopRecord } from "../lib/shopAuth.server";
import { uploadCustomizationImage } from "../lib/settings.server";

const uploadHandler = unstable_createMemoryUploadHandler({
  maxPartSize: 5 * 1024 * 1024, // 5MB parity with legacy multer limit
});

export const action = async ({ request }) => {
  try {
    if (request.method !== "POST") {
      return Response.json(
        { success: false, message: "Method not allowed" },
        { status: 405 },
      );
    }

    const { admin, session } = await authenticate.admin(request);
    await loadShopRecord(session); // ensure the shop exists; no need to use the record here

    const formData = await unstable_parseMultipartFormData(request, uploadHandler);
    const rawFile = formData.get("image");
    const moduleType = formData.get("moduleType");

    if (!rawFile || typeof rawFile === "string") {
      return Response.json(
        { success: false, message: "No file" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await rawFile.arrayBuffer());
    const file = {
      buffer,
      originalname: rawFile.name,
      mimetype: rawFile.type,
    };

    const result = await uploadCustomizationImage({ admin, file, moduleType });
    return Response.json(result.body, { status: result.status });
  } catch (error) {
    if (error instanceof Response) throw error;
    console.error("Upload Error:", error);
    return Response.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
};
