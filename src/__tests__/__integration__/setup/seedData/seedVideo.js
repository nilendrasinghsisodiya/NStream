import { Video } from '../../../../models/video.model.js';
import { seedUser } from './seedUser.js';

export async function seedVideo({ ownerId, overrides = {} } = {}) {
  try {
    let owner = ownerId;

    if (!owner) {
      const user = await seedUser();
      owner = user._id;
    }

    const video = await Video.create({
      videoFile: 'http://test.com/testVideo.mp4',
      thumbnail: 'http://test.com/testThumb.jpg',
      title: 'Test Video',
      duration: 120,
      owner,
      videoFilePublicId: 'testVideoPublicId',
      thumbnailPublicId: 'testThumbnailPublicId',
      tags: ['test', 'integration'],
      isPublished: true,
      deleted: false,
      ...overrides,
    });

    return video;
  } catch (err) {
    console.error('Failed to seed test video');
    throw err;
  }
}
