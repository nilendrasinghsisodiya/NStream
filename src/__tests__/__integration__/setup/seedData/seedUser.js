import { User } from '../../../../models/user.model.js';

export async function seedUser(overrides = {}) {
  try {
    const user = await User.create({
      username: 'test1234',
      password: 'test1234',
      email: 'test@test.com',
      fullname: 'test test',
      description: 'this is a test user',
      avatar: 'http://test.com/test.jpg',
      avatarPublicId: 'testAvatarId',
      deleteed: false,
      isProfileComplete: true,
      ...overrides,
    });

    console.log('TEST USER CREATED:: ', user);
    return user;
  } catch (err) {
    console.error('Failed To Seed Test User');
    throw err;
  }
}

export async function seedFreshUser(overrides = {}) {
  try {
    const user = await User.create({
      username: 'freshUser',
      password: 'freshUser',
      isEmailVerified: true,
      email: 'freshUser@test.com',
      deleteed: false,
      isProfileComplete: false,
      ...overrides,
    });

    console.log('FRESH TEST USER CREATED:: ', user);
    return user;
  } catch (err) {
    console.error('Failed To Seed fresh Test User');
    throw err;
  }
}

export async function seedSignedUpUser(overrides = {}) {
  try {
    const user = await User.create({
      username: 'signedUpUser',
      password: 'signedUpUser',
      isEmailVerified: false,
      email: 'signedUpUser@test.com',
      deleteed: false,
      isProfileComplete: false,
      ...overrides,
    });

    console.log('SIGNEDUP TEST USER CREATED:: ', user);
  } catch (err) {
    console.error('Failed To Seed SIGNEDUP Test User');
    throw err;
  }
}
