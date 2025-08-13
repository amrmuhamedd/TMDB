import { Test } from '@nestjs/testing';
import { TmdbModule } from './tmdb.module';
import { TmdbService } from './services/tmdb.service';

describe('TmdbModule', () => {
  it('should compile the module', async () => {
    const module = await Test.createTestingModule({
      imports: [TmdbModule],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should provide TmdbService', async () => {
    const module = await Test.createTestingModule({
      imports: [TmdbModule],
    }).compile();

    const service = module.get<TmdbService>(TmdbService);
    expect(service).toBeInstanceOf(TmdbService);
  });
});
