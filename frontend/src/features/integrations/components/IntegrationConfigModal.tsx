import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal, ModalFooter } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { Select } from '@/shared/components/ui/Select';
import { cn } from '@/shared/lib/utils';
import { PROVIDER_CONFIG_SCHEMAS } from '../validators/integration.validators';
import type {
  IntegrationProvider,
  IntegrationConnection,
  ConfigField,
} from '../types/integration.types';

interface IntegrationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  provider: IntegrationProvider | null;
  connection: IntegrationConnection | null;
  onSave: (connectionId: string, config: Record<string, unknown>) => void;
  isSaving: boolean;
}

export function IntegrationConfigModal({
  isOpen,
  onClose,
  provider,
  connection,
  onSave,
  isSaving,
}: IntegrationConfigModalProps) {
  const schema = provider ? PROVIDER_CONFIG_SCHEMAS[provider.id] : undefined;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
  });

  useEffect(() => {
    if (isOpen && connection) {
      reset(connection.config);
    }
  }, [isOpen, connection, reset]);

  const handleFormSubmit = (data: Record<string, unknown>) => {
    if (connection) {
      onSave(connection._id, data);
    }
  };

  if (!provider || !connection) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configure ${provider.name}`}
      description={`Customize how ${provider.name} integrates with your workspace.`}
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        {provider.configFields.map((field) => (
          <ConfigFieldRenderer
            key={field.key}
            field={field}
            register={register}
            control={control}
            error={errors[field.key]?.message as string | undefined}
          />
        ))}

        <ModalFooter>
          <Button variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSaving}>
            Save Configuration
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

function ConfigFieldRenderer({
  field,
  register,
  control,
  error,
}: {
  field: ConfigField;
  register: ReturnType<typeof useForm>['register'];
  control: ReturnType<typeof useForm>['control'];
  error?: string;
}) {
  switch (field.type) {
    case 'text':
      return (
        <Input
          label={field.label}
          placeholder={field.placeholder}
          error={error}
          helperText={field.helpText}
          required={field.required}
          {...register(field.key)}
        />
      );

    case 'select':
      return (
        <Select
          label={field.label}
          options={field.options ?? []}
          error={error}
          helperText={field.helpText}
          required={field.required}
          {...register(field.key)}
        />
      );

    case 'toggle':
      return (
        <Controller
          name={field.key}
          control={control}
          render={({ field: formField }: { field: { value: boolean; onChange: (v: boolean) => void } }) => (
            <label className="flex items-center justify-between gap-3">
              <div>
                <span className="text-sm font-medium text-foreground">{field.label}</span>
                {field.helpText && (
                  <p className="text-xs text-muted-foreground">{field.helpText}</p>
                )}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={formField.value}
                onClick={() => formField.onChange(!formField.value)}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  formField.value ? 'bg-primary' : 'bg-muted'
                )}
              >
                <span
                  className={cn(
                    'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                    formField.value && 'translate-x-5'
                  )}
                />
              </button>
            </label>
          )}
        />
      );

    default:
      return null;
  }
}
