import bcrypt from 'bcrypt';

export default {
  firstName: 'test 1',
  lastName: 'user ',
  email: 'testuser@email.com',
  password: bcrypt.hashSync('password', 12),
};

export const mockUser2 = {
  firstName: 'testt 2',
  lastName: 'user 2',
  email: 'testuser22@email.com',
  password: bcrypt.hashSync('password', 12),
};
