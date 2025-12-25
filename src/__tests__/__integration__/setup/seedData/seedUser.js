import { User } from '../../../models/user.model.js';

export async function seedUser() {
  try {
    const user = await User.create({
      username: 'test1234',
      password: 'test1234',
      email: 'test@test.com',
      fullName: 'test test',
      description: 'this is a test user',
      avatar: 'http://test.com/test.jpg',
      avatarPublicId: 'testAvatarId',
      deleteed: false,
      isProfileComplete: true,
    });

    console.log('TEST USER CREATED:: ', user);
  } catch (err) {
    console.error('Failed To Seed Test User');
    throw err;
  }
}

export async function seedVideo() {
  try {
  } catch (err) {}
}
