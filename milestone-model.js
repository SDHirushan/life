
/*
 * LIFE QUEST — UNIFIED MILESTONE MODEL
 *
 * This file defines a common structure for every milestone.
 * It does NOT change or migrate existing storage.
 */

(() => {
    'use strict';

    // Common task structure
    function normalizeTask(task, index = 0) {
        const value = typeof task === 'string'
            ? { text: task }
            : (task && typeof task === 'object' ? task : {});

        return {
            ...value,
            id: String(value.id || `task-${index + 1}`),
            text: String(value.text || ''),
            done: Boolean(value.done)
        };
    }

    function normalizeTasks(tasks) {
        if (!Array.isArray(tasks)) return [];

        return tasks.map((task, index) =>
            normalizeTask(task, index)
        );
    }

    // Common milestone structure
    function normalizeMilestone(record) {
        const year = Number(record.year);

        return {
            id: String(record.id),
            level: String(record.level),
            parentId: record.parentId ?? null,

            year: Number.isFinite(year) ? year : null,

            name: String(record.name || ''),
            title: String(record.title || ''),
            description: String(record.description || ''),
            location: String(record.location || ''),
            landmarkType: String(record.landmarkType || 'camp'),

            tasks: normalizeTasks(record.tasks),
            notes: String(record.notes || ''),
            done: Boolean(record.done),

            source: String(record.source || 'user'),

            // Reference to the existing storage.
            // This lets us migrate gradually without losing data.
            legacy: record.legacy || null,

            // Photos remain in IndexedDB.
            photoGallery: record.photoGallery || null
        };
    }

    // Convert an original built-in year into the common structure.
    function fromOriginalYear(chapter, savedData, index) {
        const saved = savedData || {};
        const year = Number(chapter.year);

        const name =
            typeof saved.customName === 'string' &&
            saved.customName.trim()
                ? saved.customName
                : chapter.name;

        const title =
            typeof saved.customTitle === 'string' &&
            saved.customTitle.trim()
                ? saved.customTitle
                : chapter.title;

        return normalizeMilestone({
            id: `year:${year}`,
            level: 'year',
            parentId: null,
            year,

            name,
            title,
            description: chapter.desc,
            location: chapter.place,
            landmarkType: chapter.type,

            tasks: Array.isArray(saved.tasks)
                ? saved.tasks
                : chapter.tasks,

            notes: saved.notes || '',
            done: saved.done,

            source: 'builtin',

            legacy: {
                storageKey: 'lifequest-v1',
                recordIndex: index
            },

            photoGallery: {
                database: 'lifequest-hierarchy-photos-v1',
                store: 'photos',
                prefix: `year-gallery:${year}:`,
                primaryKey: null,
                legacyImage: saved.image || ''
            }
        });
    }

    // Convert a previously created custom milestone.
    function fromCustomMilestone(item) {
        const id = String(item.id);

        return normalizeMilestone({
            id: `custom:${id}`,
            level: 'milestone',
            parentId: null,
            year: item.year,

            name: item.name,
            title: item.name,
            description: item.description,
            location: '',
            landmarkType: item.type,

            tasks: item.tasks || [],
            notes: item.notes || '',
            done: item.done,

            source: 'custom',

            legacy: {
                storageKey: 'lifequest-custom-milestones-v1',
                recordId: id
            },

            photoGallery: {
                database: 'lifequest-custom-photos',
                store: 'photos',
                prefix: `gallery:${id}:`,
                primaryKey: id,
                hasPrimaryPhoto: Boolean(item.hasPhoto)
            }
        });
    }

    // Common IDs for future hierarchy integration.
    function makeMonthId(year, monthIndex) {
        const month = String(monthIndex + 1).padStart(2, '0');
        return `month:${year}-${month}`;
    }

    // Public API
    window.LQMilestoneModel = Object.freeze({
        normalizeTask,
        normalizeTasks,
        normalizeMilestone,
        fromOriginalYear,
        fromCustomMilestone,
        makeMonthId
    });

})();
