// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * Definitions for the AI kernel.
 */

import type { Remote } from 'comlink';

import { IWorkerKernel } from '@jupyterlite/kernel';
/**
 * An interface for AI workers.
 */
export interface IAIWorkerKernel extends IWorkerKernel {
  /**
   * Handle any lazy initialization activities.
   */
  initialize(options: IAIWorkerKernel.IOptions): Promise<void>;
}

/**
 * An convenience interface for AI workers wrapped by a comlink Remote.
 */
export type IRemoteAIWorkerKernel = Remote<IAIWorkerKernel>;

/**
 * An namespace for AI workers.
 */
export namespace IAIWorkerKernel {
  /**
   * Initialization options for a worker.
   */
  export type IOptions = IWorkerKernel.IOptions;
}
