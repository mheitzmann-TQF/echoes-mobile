import { Platform } from 'react-native';

let flowCounter = 0;

export function generateFlowId(): string {
  flowCounter++;
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${timestamp}-${random}-${flowCounter}`;
}

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogData {
  [key: string]: any;
}

function formatLog(stage: string, level: LogLevel, message: string, data?: LogData, flowId?: string): string {
  const parts = [`[TQF:IAP:${stage}]`];
  if (flowId) {
    parts.push(`[${flowId}]`);
  }
  parts.push(`[${level}]`);
  parts.push(message);
  if (data) {
    parts.push(JSON.stringify(data));
  }
  return parts.join(' ');
}

function log(stage: string, level: LogLevel, message: string, data?: LogData, flowId?: string) {
  if (Platform.OS !== 'ios') return;
  
  const formatted = formatLog(stage, level, message, data, flowId);
  
  switch (level) {
    case 'ERROR':
      console.error(formatted);
      break;
    case 'WARN':
      console.warn(formatted);
      break;
    default:
      console.log(formatted);
  }
}

export const iapLog = {
  init: {
    info: (msg: string, data?: LogData, flowId?: string) => log('INIT', 'INFO', msg, data, flowId),
    error: (msg: string, data?: LogData, flowId?: string) => log('INIT', 'ERROR', msg, data, flowId),
  },
  purchase: {
    info: (msg: string, data?: LogData, flowId?: string) => log('PURCHASE', 'INFO', msg, data, flowId),
    warn: (msg: string, data?: LogData, flowId?: string) => log('PURCHASE', 'WARN', msg, data, flowId),
    error: (msg: string, data?: LogData, flowId?: string) => log('PURCHASE', 'ERROR', msg, data, flowId),
  },
  listener: {
    info: (msg: string, data?: LogData, flowId?: string) => log('LISTENER', 'INFO', msg, data, flowId),
    warn: (msg: string, data?: LogData, flowId?: string) => log('LISTENER', 'WARN', msg, data, flowId),
    error: (msg: string, data?: LogData, flowId?: string) => log('LISTENER', 'ERROR', msg, data, flowId),
  },
  verify: {
    info: (msg: string, data?: LogData, flowId?: string) => log('VERIFY', 'INFO', msg, data, flowId),
    warn: (msg: string, data?: LogData, flowId?: string) => log('VERIFY', 'WARN', msg, data, flowId),
    error: (msg: string, data?: LogData, flowId?: string) => log('VERIFY', 'ERROR', msg, data, flowId),
  },
  restore: {
    info: (msg: string, data?: LogData, flowId?: string) => log('RESTORE', 'INFO', msg, data, flowId),
    warn: (msg: string, data?: LogData, flowId?: string) => log('RESTORE', 'WARN', msg, data, flowId),
    error: (msg: string, data?: LogData, flowId?: string) => log('RESTORE', 'ERROR', msg, data, flowId),
  },
  status: {
    info: (msg: string, data?: LogData, flowId?: string) => log('STATUS', 'INFO', msg, data, flowId),
    warn: (msg: string, data?: LogData, flowId?: string) => log('STATUS', 'WARN', msg, data, flowId),
    error: (msg: string, data?: LogData, flowId?: string) => log('STATUS', 'ERROR', msg, data, flowId),
  },
  result: {
    info: (msg: string, data?: LogData, flowId?: string) => log('RESULT', 'INFO', msg, data, flowId),
    error: (msg: string, data?: LogData, flowId?: string) => log('RESULT', 'ERROR', msg, data, flowId),
  },
};
