/**
 * QAQC SaaS - Analysis Draft Store (Zustand)
 * Persists analysis state to localStorage so users don't lose work when switching tools
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type QaqcToolType =
    | "CRM"
    | "BLANKS"
    | "DUPLICATES"
    | "Z_SCORE"
    | "CHECK_ASSAY";

export interface ColumnMapping {
    [key: string]: string | undefined;
}

export interface AnalysisDraft {
    data: Record<string, unknown>[] | null; // CSV data as array of objects
    columns: string[];
    columnMapping: ColumnMapping;
    filters: Record<string, unknown>;
    styleSettings: Record<string, unknown>;
    results?: Record<string, unknown>[] | unknown; // Calculated charts/results
    overrides?: Record<string, unknown>; // Per-item overrides
    lastModified: number;
}

interface AnalysisStore {
    // Drafts keyed by userId -> toolType
    userDrafts: Record<string, Partial<Record<QaqcToolType, AnalysisDraft>>>;

    // Actions
    setDraft: (userId: string, toolType: QaqcToolType, draft: Partial<AnalysisDraft>) => void;
    getDraft: (userId: string, toolType: QaqcToolType) => AnalysisDraft | undefined;
    clearDraft: (userId: string, toolType: QaqcToolType) => void;
    clearAllDrafts: (userId: string) => void;

    // Data persistence
    setData: (userId: string, toolType: QaqcToolType, data: Record<string, unknown>[]) => void;
    setColumnMapping: (userId: string, toolType: QaqcToolType, mapping: ColumnMapping) => void;
    setFilters: (userId: string, toolType: QaqcToolType, filters: Record<string, unknown>) => void;
}

const createEmptyDraft = (): AnalysisDraft => ({
    data: null,
    columns: [],
    columnMapping: {},
    filters: {},
    styleSettings: {},
    results: [],
    overrides: {},
    lastModified: Date.now(),
});

export const useAnalysisStore = create<AnalysisStore>()(
    persist(
        (set, get) => ({
            userDrafts: {},

            setDraft: (userId, toolType, draft) =>
                set((state) => {
                    const userStore = state.userDrafts[userId] || {};
                    const currentDraft = userStore[toolType] || createEmptyDraft();

                    return {
                        userDrafts: {
                            ...state.userDrafts,
                            [userId]: {
                                ...userStore,
                                [toolType]: {
                                    ...currentDraft,
                                    ...draft,
                                    lastModified: Date.now(),
                                },
                            },
                        },
                    };
                }),

            getDraft: (userId, toolType) => get().userDrafts[userId]?.[toolType],

            clearDraft: (userId, toolType) =>
                set((state) => {
                    const userStore = state.userDrafts[userId];
                    if (!userStore) return state;

                    const { [toolType]: _, ...rest } = userStore;
                    return {
                        userDrafts: {
                            ...state.userDrafts,
                            [userId]: rest,
                        },
                    };
                }),

            clearAllDrafts: (userId) =>
                set((state) => {
                    const { [userId]: _, ...rest } = state.userDrafts;
                    return { userDrafts: rest };
                }),

            setData: (userId, toolType, data) => {
                const columns = data.length > 0 ? Object.keys(data[0]) : [];
                get().setDraft(userId, toolType, { data, columns });
            },

            setColumnMapping: (userId, toolType, mapping) =>
                get().setDraft(userId, toolType, { columnMapping: mapping }),

            setFilters: (userId, toolType, filters) =>
                get().setDraft(userId, toolType, { filters }),
        }),
        {
            name: "qaqc-analysis-drafts",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ userDrafts: state.userDrafts }),
        }
    )
);
