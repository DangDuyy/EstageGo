import { createUploadthing } from "uploadthing/express";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const uploadRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .onUploadComplete(async ({ file, metadata }) => {
      console.log("Upload done by:", metadata.userId);
      console.log("File URL:", file.ufsUrl);

      // Lưu DB / Qdrant tại đây
      return {
        url: file.ufsUrl,
      };
    }),
};
