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
            storage: {
                getItem: (name) => {
                    try {
                        const value = localStorage.getItem(name);
                        return value ? JSON.parse(value) : null;
                    } catch (e) {
                        console.error("Failed to read from localStorage:", e);
                        return null;
                    }
                },
                setItem: (name, value) => {
                    try {
                        localStorage.setItem(name, JSON.stringify(value));
                    } catch (e) {
                        // Quota exceeded - clear old data and try again
                        console.warn("localStorage quota exceeded, clearing old drafts...", e);
                        try {
                            localStorage.removeItem(name);
                            localStorage.setItem(name, JSON.stringify(value));
                        } catch (e2) {
                            console.error("Still failed after clearing, drafts will not persist:", e2);
                        }
                    }
                },
                removeItem: (name) => {
                    try {
                        localStorage.removeItem(name);
                    } catch (e) {
                        console.error("Failed to remove from localStorage:", e);
                    }
                },
            },
            // IMPORTANT: Exclude raw `data` from persistence to avoid quota issues
            // Raw CSV data can be very large - only store config/settings
            partialize: (state) => ({
                userDrafts: Object.fromEntries(
                    Object.entries(state.userDrafts).map(([userId, tools]) => [
                        userId,
                        Object.fromEntries(
                            Object.entries(tools || {}).map(([toolType, draft]) => [
                                toolType,
                                {
                                    // Exclude `data` field - it's too large for localStorage
                                    columns: draft?.columns || [],
                                    columnMapping: draft?.columnMapping || {},
                                    filters: draft?.filters || {},
                                    styleSettings: draft?.styleSettings || {},
                                    // Keep results but limit size
                                    results: draft?.results,
                                    overrides: draft?.overrides || {},
                                    lastModified: draft?.lastModified || Date.now(),
                                },
                            ])
                        ),
                    ])
                ),
            }) as any,
        }
    )
);
