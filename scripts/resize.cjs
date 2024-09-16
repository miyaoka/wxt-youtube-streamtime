const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

// base image
const image = fs.readFileSync(path.resolve(__dirname, "base.png"));

// dest dir
const destDir = path.resolve(__dirname, "../src/public/icon");

// resize image
const resizeTarget = [128, 96, 48, 32, 16];
resizeTarget.forEach((size) => {
  sharp(image)
    .resize(size, size)
    .toBuffer()
    .then((data) => {
      console.log(`generate ${size}.png`);
      fs.writeFileSync(path.resolve(destDir, `${size}.png`), data);
    });
});
