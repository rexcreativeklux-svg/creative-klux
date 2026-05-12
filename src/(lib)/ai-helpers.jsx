import { toast } from 'sonner';
// import { base44 } from '@/api/base44Client';

/**
 * Wrapper around GenerateImage that shows a friendly error for credit limits.
 */
export async function generateImage(params) {
  try {
    return await base44.integrations.Core.GenerateImage(params);
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes('402') || msg.includes('limit') || msg.includes('credits')) {
      toast.error('Monthly AI credits limit reached. Please upgrade your plan to continue.', { duration: 6000 });
    } else {
      toast.error('AI generation failed. Please try again.');
    }
    throw err;
  }
}

/**
 * Wrapper around UploadFile that shows friendly errors.
 */
export async function uploadFile(params) {
  try {
    return await base44.integrations.Core.UploadFile(params);
  } catch (err) {
    const msg = err?.message || String(err);
    if (msg.includes('402') || msg.includes('limit') || msg.includes('credits')) {
      toast.error('Monthly AI credits limit reached. Please upgrade your plan.', { duration: 6000 });
    } else {
      toast.error('Upload failed. Please try again.');
    }
    throw err;
  }
}