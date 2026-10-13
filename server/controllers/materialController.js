import Material from "../models/Material.js";
import { asyncHandler, httpError, getClassForUser } from "../utils/access.js";

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB stored as base64 in MongoDB

// GET /api/materials?classId=
export const listMaterials = asyncHandler(async (req, res) => {
  await getClassForUser(req.query.classId, req.user);
  const materials = await Material.find({ class: req.query.classId }).sort({ createdAt: -1 });
  res.json(materials);
});

// POST /api/materials   { title, type, url, filename, size, classId }
export const createMaterial = asyncHandler(async (req, res) => {
  const { title, type, url, filename, size, classId } = req.body || {};
  if (!title || !url || !classId) throw httpError(400, "Title, file/link and class are required");

  await getClassForUser(classId, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot upload materials");

  const kind = type === "link" ? "link" : "file";
  if (kind === "link") {
    if (!/^https?:\/\//i.test(url)) throw httpError(400, "Links must start with http:// or https://");
  } else {
    if (Number(size) > MAX_FILE_BYTES) {
      throw httpError(400, "File is too large. The maximum size is 5 MB.");
    }
    if (!String(url).startsWith("data:")) {
      throw httpError(400, "Uploaded files must be sent as a data URL");
    }
  }

  const material = await Material.create({
    title,
    type: kind,
    url,
    filename: filename || "",
    size: Number(size) || 0,
    class: classId,
    uploadedBy: req.user._id,
  });
  res.status(201).json(material);
});

// DELETE /api/materials/:id
export const deleteMaterial = asyncHandler(async (req, res) => {
  const material = await Material.findById(req.params.id);
  if (!material) throw httpError(404, "Material not found");
  await getClassForUser(material.class, req.user);
  if (req.user.role === "student") throw httpError(403, "Students cannot delete materials");

  await material.deleteOne();
  res.json({ message: "Material deleted" });
});
