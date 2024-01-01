// import { ISettingRegistry } from '@jupyterlab/settingregistry';

// import { requestAPI } from './handler';

import {
  JupyterLiteServer,
  JupyterLiteServerPlugin
} from '@jupyterlite/server';

import { IKernel, IKernelSpecs } from '@jupyterlite/kernel';

import { AIKernel } from './kernel';

/**
 * A plugin to register the ai kernel.
 */
const kernel: JupyterLiteServerPlugin<void> = {
  id: '@jupyterlite/ai-kernel:kernel',
  autoStart: true,
  requires: [IKernelSpecs],
  activate: (app: JupyterLiteServer, kernelspecs: IKernelSpecs) => {
    kernelspecs.register({
      spec: {
        name: 'AI',
        display_name: 'AI',
        language: 'JavaScript',
        argv: [],
        resources: {
          'logo-32x32': '',
          'logo-64x64': ''
        }
      },
      create: async (options: IKernel.IOptions): Promise<IKernel> => {
        return new AIKernel(options);
      }
    });
  }
};

export default kernel;

export * from './kernel';
export * from './tokens';