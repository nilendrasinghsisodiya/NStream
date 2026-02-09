import { seedUser } from './seedUser.js';
import { seedVideo } from './seedVideo.js';
import { Comment } from '../../../../models/comment.model.js';

export async function seedComment(user, video, overrides = {}) {
  try {
    if (!user) {
      // seed a user for just comment let video seed its own user
      user = await seedUser({
        email: 'commentUser@test.com',
        password: 'commentUser',
        username: 'commentUser',
        fullname: 'commentUser',
      });
    }
    if (!video) {
      // this will have its own user be default
      video = await seedVideo();
    }
    await Comment.create({
      content: 'this is a test comment created by comment user',
      video: video._id,
      owner: user._id,
      reply: null,
      ...overrides,
    });
    console.log('comment seeded successfully');
  } catch (error) {
    console.error('failed to seed comment');
    throw error;
  }
}
