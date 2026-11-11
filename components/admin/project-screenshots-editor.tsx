"use client";

import CloudinaryUpload from "@/components/admin/cloudinary-upload";
import type { ImageAsset } from "@/lib/validators/schemas";

export default function ProjectScreenshotsEditor({
  assets,
  onChange,
  onUploadingChange,
}: {
  assets: ImageAsset[];
  onChange: (assets: ImageAsset[]) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  return (
    <section
      aria-labelledby="project-screenshots-label"
      className="project-screenshots-editor"
    >
      <div className="project-screenshots-heading">
        <h3 id="project-screenshots-label" className="form-label">
          Project screenshots
        </h3>
        <span className="tag-pill">{assets.length} added</span>
      </div>
      <p className="form-help-text">
        Add more views of your project. Visitors can click any screenshot to
        view it on the project page. Use the arrows to set the order and alt
        text to describe each image.
      </p>
      <CloudinaryUpload
        section="projects"
        multiple
        reorder
        allowUrl
        uploadLabel="Add screenshots"
        initialAssets={assets}
        onUploadingChange={onUploadingChange}
        onChange={onChange}
      />
    </section>
  );
}
