import { Test, TestingModule } from '@nestjs/testing';
import { MonetaryService } from './monetary.service';

describe('MonetaryService', () => {
  let service: MonetaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonetaryService],
    }).compile();

    service = module.get<MonetaryService>(MonetaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
