import * as ImagePicker from "expo-image-picker";
import type { UploadFile } from "@noalhub/api/media";

/**
 * Request library permission and pick an image from the device's photo gallery.
 */
export async function pickImage(): Promise<UploadFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const uri = asset.uri;
  const name = asset.fileName ?? uri.split("/").pop() ?? "avatar.jpg";
  const type = asset.mimeType ?? "image/jpeg";
  const size = asset.fileSize ?? 0;

  return {
    uri,
    name,
    type,
    size,
  };
}
