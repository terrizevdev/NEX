const ffmpeg = require("fluent-ffmpeg");
const { randomBytes } = require("crypto");
const fs = require("fs");
const { getHttpStream, toBuffer } = require("@whiskeysockets/baileys");
const sharp = require("sharp");
const { spawn } = require("child_process");
const path = require("path");
const { fromBuffer } = require("file-type");
const { tmpdir } = require("os");
const ff = require("fluent-ffmpeg");
const webp = require("node-webpmux");

async function toGif(input) {
  try {
    const webpPath = "./" + randomBytes(3).toString("hex") + ".webp";
    const gifPath = "./" + randomBytes(3).toString("hex") + ".gif";
    fs.writeFileSync(webpPath, input.toString("binary"), "binary");
    const resultPath = await new Promise(resolve => {
      spawn("convert", [webpPath, gifPath]).on("error", error => {
        throw error;
      }).on("exit", () => resolve(gifPath));
    });
    let gifBuffer = fs.readFileSync(resultPath);
    try {
      fs.unlinkSync(webpPath);
    } catch {}
    try {
      fs.unlinkSync(gifPath);
    } catch {}
    return gifBuffer;
  } catch (error) {
    console.log(error);
  }
}

async function toMp4(input) {
  try {
    let gifPath = "./" + randomBytes(3).toString("hex") + ".gif";
    const inputPath = fs.existsSync(input) ? input : save(input, gifPath);
    const mp4Path = "./" + randomBytes(3).toString("hex") + ".mp4";
    const resultPath = await new Promise(resolve => {
      ffmpeg(inputPath).outputOptions(["-pix_fmt yuv420p", "-c:v libx264", "-movflags +faststart", "-filter:v crop='floor(in_w/2)*2:floor(in_h/2)*2'"]).toFormat("mp4").noAudio().save(mp4Path).on("exit", () => resolve(mp4Path));
    });
    let mp4Buffer = await fs.promises.readFile(resultPath);
    try {
      fs.unlinkSync(inputPath);
    } catch {}
    try {
      fs.unlinkSync(mp4Path);
    } catch {}
    return mp4Buffer;
  } catch (error) {
    console.log(error);
  }
}

const EightD = async audio => {
  const inputPath = "./temp/" + randomBytes(3).toString("hex") + ".mp3";
  audio = Buffer.isBuffer(audio) ? save(audio, inputPath) : audio;
  const outputPath = "./temp/" + randomBytes(3).toString("hex") + ".mp3";
  const resultPath = await new Promise(resolve => {
    ffmpeg(audio).audioFilter(["apulsator=hz=0.125"]).audioFrequency(44100).audioChannels(2).audioBitrate("128k").audioCodec("libmp3lame").audioQuality(5).toFormat("mp3").save(outputPath).on("end", () => resolve(outputPath));
  });
  return resultPath;
};

function save(buffer, filePath = "./temp/saveFile.jpg") {
  try {
    fs.writeFileSync(filePath, buffer.toString("binary"), "binary");
    return filePath;
  } catch (error) {
    console.log(error);
  }
}

const resizeImage = (buffer, width, height) => {
  if (!Buffer.isBuffer(buffer)) {
    throw "Input is not a Buffer";
  }
  return new Promise(async resolve => {
    sharp(buffer).resize(width, height, {
      fit: "contain"
    }).toBuffer().then(resolve);
  });
};

const _parseInput = async (input, extension = false, returnType = "path") => {
  const buffer = await toBuffer(await getHttpStream(input));
  const filePath = "./temp/file_" + randomBytes(3).toString("hex") + "." + (extension ? extension : (await fromBuffer(buffer)).ext);
  const finalPath = Buffer.isBuffer(input) ? save(input, filePath) : fs.existsSync(input) ? input : input;
  if (returnType == "path") {
    return finalPath;
  } else if (returnType == "buffer") {
    const fileBuffer = await fs.promises.readFile(finalPath);
    try {
      await fs.promises.unlink(filePath);
    } catch (error) {}
    return fileBuffer;
  }
};

async function imageToWebp(image) {
  const webpPath = path.join(tmpdir(), randomBytes(6).readUIntLE(0, 6).toString(36) + ".webp");
  const jpgPath = path.join(tmpdir(), randomBytes(6).readUIntLE(0, 6).toString(36) + ".jpg");
  fs.writeFileSync(jpgPath, image);
  await new Promise((resolve, reject) => {
    ff(jpgPath).on("error", reject).on("end", () => resolve(true)).addOutputOptions(["-vcodec", "libwebp", "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse"]).toFormat("webp").save(webpPath);
  });
  const webpBuffer = fs.readFileSync(webpPath);
  fs.unlinkSync(webpPath);
  fs.unlinkSync(jpgPath);
  return webpBuffer;
}

async function videoToWebp(video) {
  const webpPath = path.join(tmpdir(), randomBytes(6).readUIntLE(0, 6).toString(36) + ".webp");
  const mp4Path = path.join(tmpdir(), randomBytes(6).readUIntLE(0, 6).toString(36) + ".mp4");
  fs.writeFileSync(mp4Path, video);
  await new Promise((resolve, reject) => {
    ff(mp4Path).on("error", reject).on("end", () => resolve(true)).addOutputOptions(["-vcodec", "libwebp", "-vf", "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse", "-loop", "0", "-ss", "00:00:00", "-t", "00:00:05", "-preset", "default", "-an", "-vsync", "0"]).toFormat("webp").save(webpPath);
  });
  const webpBuffer = fs.readFileSync(webpPath);
  fs.unlinkSync(webpPath);
  fs.unlinkSync(mp4Path);
  return webpBuffer;
}

async function writeExifImg(image, metadata) {
  let webpBuffer = await imageToWebp(image);
  const inputPath = path.join(tmpdir(), randomBytes(6).readUIntLE(0, 6).toString(36) + ".webp");
  const outputPath = path.join(tmpdir(), randomBytes(6).readUIntLE(0, 6).toString(36) + ".webp");
  fs.writeFileSync(inputPath, webpBuffer);
  if (metadata.packname || metadata.author) {
    const img = new webp.Image();
    const json = {
      "sticker-pack-id": "ANONYMOUS",
      "sticker-pack-name": metadata.packname,
      "sticker-pack-publisher": metadata.author,
      emojis: metadata.categories ? metadata.categories : [""]
    };
    const exif = Buffer.from([73, 73, 42, 0, 8, 0, 0, 0, 1, 0, 65, 87, 7, 0, 0, 0, 0, 0, 22, 0, 0, 0]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), "utf-8");
    const exifBuffer = Buffer.concat([exif, jsonBuffer]);
    exifBuffer.writeUIntLE(jsonBuffer.length, 14, 4);
    await img.load(inputPath);
    fs.unlinkSync(inputPath);
    img.exif = exifBuffer;
    await img.save(outputPath);
    return outputPath;
  }
}

async function writeExifVid(video, metadata) {
  let webpBuffer = await videoToWebp(video);
  const inputPath = path.join(tmpdir(), randomBytes(6).readUIntLE(0, 6).toString(36) + ".webp");
  const outputPath = path.join(tmpdir(), randomBytes(6).readUIntLE(0, 6).toString(36) + ".webp");
  fs.writeFileSync(inputPath, webpBuffer);
  let packname;
  let author;
  try {
    packname = metadata.packname;
  } catch (error) {
    packname = "Asta-Md";
  }
  try {
    author = metadata.author;
  } catch (error) {
    author = "";
  }
  const img = new webp.Image();
  const json = {
    "sticker-pack-id": "Asta-Md",
    "sticker-pack-name": packname,
    "sticker-pack-publisher": author,
    emojis: metadata.categories ? metadata.categories : [""]
  };
  const exif = Buffer.from([73, 73, 42, 0, 8, 0, 0, 0, 1, 0, 65, 87, 7, 0, 0, 0, 0, 0, 22, 0, 0, 0]);
  const jsonBuffer = Buffer.from(JSON.stringify(json), "utf-8");
  const exifBuffer = Buffer.concat([exif, jsonBuffer]);
  exifBuffer.writeUIntLE(jsonBuffer.length, 14, 4);
  await img.load(inputPath);
  fs.unlinkSync(inputPath);
  img.exif = exifBuffer;
  await img.save(outputPath);
  return outputPath;
}

async function writeExifWebp(webpData, metadata) {
  const inputPath = path.join(tmpdir(), randomBytes(6).readUIntLE(0, 6).toString(36) + ".webp");
  const outputPath = path.join(tmpdir(), randomBytes(6).readUIntLE(0, 6).toString(36) + ".webp");
  fs.writeFileSync(inputPath, webpData);
  if (metadata.packname || metadata.author) {
    const img = new webp.Image();
    const json = {
      "sticker-pack-id": "Asta_Md",
      "sticker-pack-name": metadata.packname,
      "sticker-pack-publisher": metadata.author,
      emojis: metadata.categories ? metadata.categories : [""]
    };
    const exif = await Buffer.from([73, 73, 42, 0, 8, 0, 0, 0, 1, 0, 65, 87, 7, 0, 0, 0, 0, 0, 22, 0, 0, 0]);
    const jsonBuffer = await Buffer.from(JSON.stringify(json), "utf-8");
    const exifBuffer = await Buffer.concat([exif, jsonBuffer]);
    await exifBuffer.writeUIntLE(jsonBuffer.length, 14, 4);
    await img.load(inputPath);
    fs.unlinkSync(inputPath);
    img.exif = exifBuffer;
    await img.save(outputPath);
    return outputPath;
  }
}

module.exports = {
  imageToWebp: imageToWebp,
  videoToWebp: videoToWebp,
  writeExifImg: writeExifImg,
  writeExifVid: writeExifVid,
  writeExifWebp: writeExifWebp,
  toGif: toGif,
  toMp4: toMp4,
  EightD: EightD,
  _parseInput: _parseInput,
  resizeImage: resizeImage
};