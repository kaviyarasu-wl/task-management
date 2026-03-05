import { PlanRepository, CreatePlanDto } from '../../../src/modules/admin/plan.repository';
import { Plan } from '../../../src/modules/admin/models/plan.model';
import { NotFoundError } from '../../../src/core/errors/AppError';

jest.mock('../../../src/modules/admin/models/plan.model');

describe('PlanRepository', () => {
  let repository: PlanRepository;
  const mockPlan = {
    _id: 'plan-123',
    name: 'Test Plan',
    slug: 'test-plan',
    description: 'A test plan',
    projectsLimit: 10,
    usersLimit: 20,
    price: 9.99,
    billingCycle: 'monthly' as const,
    features: ['basic_tasks', 'basic_projects'],
    isActive: true,
    isDefault: false,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new PlanRepository();
  });

  describe('findAll', () => {
    it('returns all plans sorted by sortOrder and createdAt', async () => {
      const mockPlans = [mockPlan];
      (Plan.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPlans),
        }),
      });

      const result = await repository.findAll();

      expect(result).toEqual(mockPlans);
      expect(Plan.find).toHaveBeenCalled();
    });
  });

  describe('findActive', () => {
    it('returns only active plans sorted by sortOrder', async () => {
      const mockPlans = [mockPlan];
      (Plan.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockPlans),
        }),
      });

      const result = await repository.findActive();

      expect(result).toEqual(mockPlans);
      expect(Plan.find).toHaveBeenCalledWith({ isActive: true });
    });
  });

  describe('findById', () => {
    it('returns plan when found', async () => {
      (Plan.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPlan),
      });

      const result = await repository.findById('plan-123');

      expect(result).toEqual(mockPlan);
      expect(Plan.findById).toHaveBeenCalledWith('plan-123');
    });

    it('returns null when plan not found', async () => {
      (Plan.findById as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('returns plan when found by slug', async () => {
      (Plan.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPlan),
      });

      const result = await repository.findBySlug('test-plan');

      expect(result).toEqual(mockPlan);
      expect(Plan.findOne).toHaveBeenCalledWith({ slug: 'test-plan' });
    });
  });

  describe('findDefault', () => {
    it('returns default active plan', async () => {
      (Plan.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPlan),
      });

      const result = await repository.findDefault();

      expect(result).toEqual(mockPlan);
      expect(Plan.findOne).toHaveBeenCalledWith({ isDefault: true, isActive: true });
    });
  });

  describe('create', () => {
    it('creates and saves a new plan', async () => {
      const createDto: CreatePlanDto = {
        name: 'New Plan',
        slug: 'new-plan',
        projectsLimit: 5,
        usersLimit: 10,
        price: 19.99,
        billingCycle: 'monthly',
      };

      const mockSavedPlan = { ...mockPlan, ...createDto };
      const mockSave = jest.fn().mockResolvedValue(mockSavedPlan);
      (Plan as unknown as jest.Mock).mockImplementation(() => ({
        save: mockSave,
      }));

      const result = await repository.create(createDto);

      expect(Plan).toHaveBeenCalledWith(createDto);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockSavedPlan);
    });
  });

  describe('update', () => {
    it('updates and returns the plan', async () => {
      const updateData = { name: 'Updated Plan' };
      const updatedPlan = { ...mockPlan, ...updateData };

      (Plan.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedPlan),
      });

      const result = await repository.update('plan-123', updateData);

      expect(result).toEqual(updatedPlan);
      expect(Plan.findByIdAndUpdate).toHaveBeenCalledWith(
        'plan-123',
        { $set: updateData },
        { new: true, runValidators: true }
      );
    });

    it('throws NotFoundError when plan does not exist', async () => {
      (Plan.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(repository.update('nonexistent', { name: 'Test' }))
        .rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('deletes the plan', async () => {
      (Plan.findByIdAndDelete as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPlan),
      });

      await expect(repository.delete('plan-123')).resolves.not.toThrow();
      expect(Plan.findByIdAndDelete).toHaveBeenCalledWith('plan-123');
    });

    it('throws NotFoundError when plan does not exist', async () => {
      (Plan.findByIdAndDelete as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(repository.delete('nonexistent')).rejects.toThrow(NotFoundError);
    });
  });

  describe('clearDefaultFlag', () => {
    it('clears isDefault flag from all plans', async () => {
      (Plan.updateMany as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      });

      await repository.clearDefaultFlag();

      expect(Plan.updateMany).toHaveBeenCalledWith(
        { isDefault: true },
        { isDefault: false }
      );
    });
  });

  describe('setDefault', () => {
    it('clears existing default and sets new default plan', async () => {
      const updatedPlan = { ...mockPlan, isDefault: true };

      (Plan.updateMany as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      });

      (Plan.findByIdAndUpdate as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedPlan),
      });

      const result = await repository.setDefault('plan-123');

      expect(Plan.updateMany).toHaveBeenCalledWith(
        { isDefault: true },
        { isDefault: false }
      );
      expect(result.isDefault).toBe(true);
    });
  });

  describe('isSlugAvailable', () => {
    it('returns true when slug is not taken', async () => {
      (Plan.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.isSlugAvailable('new-slug');

      expect(result).toBe(true);
      expect(Plan.findOne).toHaveBeenCalledWith({ slug: 'new-slug' });
    });

    it('returns false when slug is taken', async () => {
      (Plan.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPlan),
      });

      const result = await repository.isSlugAvailable('test-plan');

      expect(result).toBe(false);
    });

    it('excludes current plan when checking slug availability', async () => {
      (Plan.findOne as jest.Mock).mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await repository.isSlugAvailable('test-plan', 'plan-123');

      expect(Plan.findOne).toHaveBeenCalledWith({
        slug: 'test-plan',
        _id: { $ne: 'plan-123' },
      });
    });
  });
});
