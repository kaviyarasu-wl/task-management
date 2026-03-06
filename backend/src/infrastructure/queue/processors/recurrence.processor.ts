import { Job } from 'bullmq';
import { RecurrenceService } from '@modules/recurrence/recurrence.service';
import { RecurrenceJobData } from '../queues';
import { createLogger } from '@infrastructure/logger';

const log = createLogger('RecurrenceProcessor');

/**
 * Recurrence processor — processes scheduled recurrence jobs.
 * Finds all due recurrences and generates tasks for them.
 */
export async function recurrenceProcessor(job: Job<RecurrenceJobData>): Promise<void> {
  const recurrenceService = new RecurrenceService();

  log.info({ jobId: job.id }, 'Processing recurrence check');

  try {
    // Get all recurrences that are due
    const dueRecurrences = await recurrenceService.getDueForGeneration();

    log.info({ jobId: job.id, dueCount: dueRecurrences.length }, 'Found due recurrences');

    let successCount = 0;
    let errorCount = 0;

    // Process each recurrence
    for (const recurrence of dueRecurrences) {
      try {
        const newTask = await recurrenceService.generateTask(recurrence);
        log.info(
          { taskId: newTask._id?.toString(), recurrenceId: recurrence._id },
          'Generated task from recurrence'
        );
        successCount++;
      } catch (error) {
        log.error(
          { err: error, recurrenceId: recurrence._id },
          'Failed to generate task for recurrence'
        );
        errorCount++;
        // Continue processing other recurrences even if one fails
      }
    }

    log.info({ jobId: job.id, successCount, errorCount }, 'Recurrence processing completed');
  } catch (error) {
    log.error({ err: error, jobId: job.id }, 'Error processing recurrences');
    throw error; // Re-throw to mark job as failed
  }
}
