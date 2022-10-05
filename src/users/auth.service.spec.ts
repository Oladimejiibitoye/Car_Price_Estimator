import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { doesNotMatch } from 'assert';
import { Logger, ServiceUnavailableException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService
  let fakeUsersService: Partial<UsersService>

  beforeEach(async () => {
    //Create a fake copy of the users service
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const fileredUsers = users.filter(user => user.email === email);
        return Promise.resolve(fileredUsers);
      },
      create: (email: string, password: string) => {
        const user = {id: Math.floor(Math.random() * 999999), email, password} as User
        users.push(user);
        return Promise.resolve(user);
      }
    };
    
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService
        }
      ]
    }).compile();

    service = module.get(AuthService);
  })


  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('t@test.com', 'password');
    
    expect(user.password).not.toEqual('password');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async (done) => {
    await service.signup('test@test.com', 'password')
    try {
      await service.signup('test@test.com', 'password')
    } catch (err) {
      done();
    }
    
  });

  it('throws if signin is called with an unused email', async(done) => {
    try{
      await service.signin('test1@test.com', 'password01')
    } catch (err) {
      done();
    }
  });

  it('throws if an invalid password is provided', async (done) => {
    await service.signup('laskdjf@alskdfj.com', 'password1')
    try {
      await service.signin('laskdjf@alskdfj.com', 'password')
    } catch (err) {
      done();
    }
    });

    it('returns a user if correct password is provided', async () => {
        await service.signup('asdf@asdf.com', 'mypassword');

        const user = await service.signin('asdf@asdf.com', 'mypassword')
        expect(user).toBeDefined();
    
      });
});

