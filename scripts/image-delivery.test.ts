import assert from "node:assert/strict";
import test from "node:test";
import {
  cloudinaryBlurDataURL,
  cloudinaryLoader,
  getOptimizedUrl,
} from "../lib/cloudinary/urls";

test("responsive sizing runs after existing Cloudinary transformations", () => {
  const source = "https://res.cloudinary.com/demo/image/upload/b_rgb:07090e,f_auto,q_auto,w_1200/v1792423733/hero.png";
  assert.equal(
    cloudinaryLoader({ src: source, width: 480 }),
    "https://res.cloudinary.com/demo/image/upload/b_rgb:07090e,f_auto,q_auto,w_1200/f_auto,q_auto,c_limit,w_480/v1792423733/hero.png",
  );
  assert.match(cloudinaryBlurDataURL(source), /w_1200\/f_auto,q_auto,c_fill,g_auto,w_24,h_16\/v1792423733/);
});

test("unversioned transformations and versioned folders retain their identity", () => {
  assert.equal(
    getOptimizedUrl("https://res.cloudinary.com/demo/image/upload/c_crop,w_1000/folder/photo.jpg", 320),
    "https://res.cloudinary.com/demo/image/upload/c_crop,w_1000/f_auto,q_auto,c_limit,w_320/folder/photo.jpg",
  );
  assert.equal(
    cloudinaryLoader({ src: "https://res.cloudinary.com/demo/image/upload/v12/t_folder/image.jpg?download=1", width: 640, quality: 75 }),
    "https://res.cloudinary.com/demo/image/upload/f_auto,q_75,c_limit,w_640/v12/t_folder/image.jpg?download=1",
  );
});

test("Unsplash crop requests include the requested width and height", () => {
  const result = new URL(getOptimizedUrl("https://images.unsplash.com/photo-1?ixid=keep", 320, 180));
  assert.equal(result.searchParams.get("w"), "320");
  assert.equal(result.searchParams.get("h"), "180");
  assert.equal(result.searchParams.get("fit"), "crop");
  assert.equal(result.searchParams.get("ixid"), "keep");
});

test("local and unrelated URLs are not rewritten as image CDN requests", () => {
  for (const src of ["/portrait.jpg", "https://example.com/res.cloudinary.com/image/upload/photo.jpg", "https://res.cloudinary.com.evil.test/demo/image/upload/photo.jpg"]) {
    assert.equal(getOptimizedUrl(src, 480), src);
    assert.equal(cloudinaryLoader({ src, width: 480 }), src);
  }
});
