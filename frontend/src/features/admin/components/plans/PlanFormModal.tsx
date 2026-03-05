import { Modal } from '@/shared/components/ui/Modal';
import { PlanForm } from './PlanForm';
import type { Plan, CreatePlanData } from '../../types/plan.types';
import type { CreatePlanFormData } from '../../validators/plan.validators';

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: Plan | null;
  onSubmit: (data: CreatePlanData) => void;
  isLoading?: boolean;
}

export function PlanFormModal({
  isOpen,
  onClose,
  plan,
  onSubmit,
  isLoading,
}: PlanFormModalProps) {
  const handleSubmit = (formData: CreatePlanFormData) => {
    const features = formData.features
      ? formData.features
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean)
      : [];

    onSubmit({
      ...formData,
      features,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={plan ? 'Edit Plan' : 'Create Plan'}
      size="lg"
    >
      <PlanForm
        plan={plan}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        onCancel={onClose}
      />
    </Modal>
  );
}
