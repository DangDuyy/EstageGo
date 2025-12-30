import {
    generateReactHelpers,
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

const UPT_URL = "http://localhost:8017/v1/uploadthing";

export const UploadButton = generateUploadButton({
  url: UPT_URL,
});

export const UploadDropzone = generateUploadDropzone({
  url: UPT_URL,
});

export const {uploadFiles} = generateReactHelpers({
  url: UPT_URL,
});