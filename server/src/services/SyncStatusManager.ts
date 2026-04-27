export interface SyncStatus {
  isSyncing: boolean;
  status: 'idle' | 'running' | 'completed' | 'error';
  totalUnits: number;
  currentUnitIndex: number;
  currentUnitName: string;
  totalProcesses: number;
  processedProcesses: number;
  syncedCount: number;
  skippedCount: number;
  /** Linhas efetivamente inseridas no banco (INSERT real) */
  insertedCount: number;
  /** Linhas efetivamente atualizadas no banco (UPDATE via upsert) */
  updatedCount: number;
  unitTotalProcesses: number;
  unitProcessedProcesses: number;
  errors: string[];
  startTime: string | null;
  endTime: string | null;
  message: string;
}

export class SyncStatusManager {
  private static instance: SyncStatusManager;
  private state: SyncStatus = {
    isSyncing: false,
    status: 'idle',
    totalUnits: 0,
    currentUnitIndex: 0,
    currentUnitName: '',
    totalProcesses: 0,
    processedProcesses: 0,
    syncedCount: 0,
    skippedCount: 0,
    insertedCount: 0,
    updatedCount: 0,
    unitTotalProcesses: 0,
    unitProcessedProcesses: 0,
    errors: [],
    startTime: null,
    endTime: null,
    message: 'Aguardando início...'
  };

  private constructor() {}

  public static getInstance(): SyncStatusManager {
    if (!SyncStatusManager.instance) {
      SyncStatusManager.instance = new SyncStatusManager();
    }
    return SyncStatusManager.instance;
  }

  public start(totalUnits: number) {
    this.state = {
      isSyncing: true,
      status: 'running',
      totalUnits,
      currentUnitIndex: 0,
      currentUnitName: '',
      totalProcesses: 0,
      processedProcesses: 0,
      syncedCount: 0,
      skippedCount: 0,
      insertedCount: 0,
      updatedCount: 0,
      unitTotalProcesses: 0,
      unitProcessedProcesses: 0,
      errors: [],
      startTime: new Date().toISOString(),
      endTime: null,
      message: 'Iniciando sincronização...'
    };
  }

  public updateUnit(index: number, name: string, unitTotal: number = 0) {
    this.state.currentUnitIndex = index;
    this.state.currentUnitName = name;
    this.state.unitTotalProcesses = unitTotal;
    this.state.unitProcessedProcesses = 0;
    this.state.message = `Processando unidade: ${name} (${index}/${this.state.totalUnits})`;
  }

  public addTotalProcesses(count: number) {
    this.state.totalProcesses += count;
  }

  public incrementProcessed(isNew: boolean, isSkipped: boolean) {
    this.state.processedProcesses++;
    this.state.unitProcessedProcesses++;
    if (isSkipped) {
      this.state.skippedCount++;
    } else if (isNew) {
      this.state.syncedCount++;
    } else {
      // Updated
      this.state.syncedCount++;
    }
  }

  /**
   * Registra uma inserção real no banco (linha nova)
   */
  public incrementInserted() {
    this.state.insertedCount++;
  }

  /**
   * Registra uma atualização real no banco (linha existente atualizada via upsert)
   */
  public incrementUpdated() {
    this.state.updatedCount++;
  }

  public addError(error: string) {
    this.state.errors.push(error);
    if (this.state.errors.length > 50) {
      this.state.errors.shift(); // Manter apenas os últimos 50 erros
    }
  }

  public finish(status: 'completed' | 'error' = 'completed', message?: string) {
    this.state.isSyncing = false;
    this.state.status = status;
    this.state.endTime = new Date().toISOString();
    this.state.message = message || (status === 'completed' ? 'Sincronização concluída com sucesso!' : 'Sincronização concluída com erros.');
  }

  public getStatus(): SyncStatus {
    return { ...this.state };
  }
}

export const syncStatusManager = SyncStatusManager.getInstance();
