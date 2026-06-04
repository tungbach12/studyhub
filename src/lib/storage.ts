import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorageInstance } from './firebase';

export async function uploadAvatar(memberId: string, file: File): Promise<string> {
  const storage = getStorageInstance();
  if (!storage) throw new Error('Firebase Storage not available');

  const storageRef = ref(storage, `avatars/${memberId}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return url;
}
