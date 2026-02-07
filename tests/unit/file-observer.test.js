/**
 * FileObserver Unit Tests (Phase 0)
 * 
 * Gate Criteria:
 * ✅ No mutations
 * ✅ No exec module loaded
 * ✅ Pressure scores calculated correctly
 * ✅ Observer runs without crashes
 * ✅ Scope enforcement works (ignores folders outside scope)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { FileObserver } from '../../core/services/file-observer.js';
import { FS_OBSERVED_EVENT } from '../../core/models/commitTypes/fileSystemCommits.js';

describe('FileObserver (Phase 0)', () => {
    let observer;
    let commitLog;
    
    beforeEach(() => {
        commitLog = {
            commits: [],
            append(commit) {
                this.commits.push(commit);
            }
        };
        
        observer = new FileObserver([
            'C:/Users/Alice/Downloads',
            'C:/Users/Alice/Documents'
        ], commitLog);
    });
    
    describe('Scope Enforcement', () => {
        it('should observe only within scope', () => {
            // Inside scope
            observer.recordEvent({
                eventType: 'create',
                path: 'C:/Users/Alice/Downloads/test.txt'
            });
            
            expect(observer.eventLog.length).toBe(1);
            expect(commitLog.commits.length).toBe(1);
            
            // Outside scope
            observer.recordEvent({
                eventType: 'create',
                path: 'C:/Users/Bob/Downloads/test.txt'
            });
            
            // Should still be 1 (second event ignored)
            expect(observer.eventLog.length).toBe(1);
            expect(commitLog.commits.length).toBe(1);
        });
        
        it('should identify correct scope for path', () => {
            const scope = observer.findScope('C:/Users/Alice/Downloads/subfolder/file.txt');
            expect(scope).toBe('C:/Users/Alice/Downloads');
        });
        
        it('should return null for out-of-scope path', () => {
            const scope = observer.findScope('C:/Users/Bob/file.txt');
            expect(scope).toBeNull();
        });
        
        it('should refuse operations outside scope', () => {
            const inScope = observer.isInScope('C:/Users/Alice/Downloads/test.txt');
            const outScope = observer.isInScope('C:/Users/Bob/test.txt');
            
            expect(inScope).toBe(true);
            expect(outScope).toBe(false);
        });
    });
    
    describe('Event Recording', () => {
        it('should record create events', () => {
            observer.recordEvent({
                eventType: 'create',
                path: 'C:/Users/Alice/Downloads/new-file.txt'
            });
            
            const event = observer.eventLog[0];
            expect(event.type).toBe(FS_OBSERVED_EVENT);
            expect(event.eventType).toBe('create');
            expect(event.path).toBe('C:/Users/Alice/Downloads/new-file.txt');
            expect(event.timestamp).toBeDefined();
            expect(event.scope).toBe('C:/Users/Alice/Downloads');
        });
        
        it('should record all event types', () => {
            const eventTypes = ['create', 'move', 'rename', 'delete'];
            
            for (const eventType of eventTypes) {
                observer.recordEvent({
                    eventType,
                    path: 'C:/Users/Alice/Downloads/file.txt'
                });
            }
            
            expect(observer.eventLog.length).toBe(4);
            expect(observer.eventLog.map(e => e.eventType)).toEqual(eventTypes);
        });
        
        it('should include metadata if provided', () => {
            observer.recordEvent({
                eventType: 'create',
                path: 'C:/Users/Alice/Downloads/test.pdf',
                metadata: {
                    size: 1024,
                    type: 'application/pdf'
                }
            });
            
            const event = observer.eventLog[0];
            expect(event.metadata.size).toBe(1024);
            expect(event.metadata.type).toBe('application/pdf');
        });
    });
    
    describe('Pressure Calculation', () => {
        beforeEach(() => {
            // Simulate activity
            for (let i = 0; i < 100; i++) {
                observer.recordEvent({
                    eventType: 'create',
                    path: `C:/Users/Alice/Downloads/file${i}.txt`
                });
            }
            
            for (let i = 0; i < 50; i++) {
                observer.recordEvent({
                    eventType: 'delete',
                    path: `C:/Users/Alice/Downloads/file${i}.txt`
                });
            }
            
            for (let i = 0; i < 20; i++) {
                observer.recordEvent({
                    eventType: 'move',
                    path: `C:/Users/Alice/Downloads/file${i}.txt`
                });
            }
        });
        
        it('should calculate pressure correctly', () => {
            const analysis = observer.calculatePressure('C:/Users/Alice/Downloads');
            
            expect(analysis.pressure).toBeGreaterThan(0);
            expect(analysis.pressure).toBeLessThanOrEqual(1.0);
            expect(analysis.folderPath).toBe('C:/Users/Alice/Downloads');
            expect(analysis.metrics).toBeDefined();
            expect(analysis.issues).toBeDefined();
        });
        
        it('should track metrics correctly', () => {
            const analysis = observer.calculatePressure('C:/Users/Alice/Downloads');
            
            expect(analysis.metrics.creates).toBe(100);
            expect(analysis.metrics.deletes).toBe(50);
            expect(analysis.metrics.moves).toBe(20);
            expect(analysis.metrics.churn).toBe(150);  // creates + deletes
        });
        
        it('should identify issues', () => {
            const analysis = observer.calculatePressure('C:/Users/Alice/Downloads');
            
            expect(analysis.issues.length).toBeGreaterThan(0);
            expect(analysis.issues.some(issue => issue.includes('created'))).toBe(true);
        });
        
        it('should handle empty folders', () => {
            observer.clearLog();
            const analysis = observer.calculatePressure('C:/Users/Alice/Documents');
            
            expect(analysis.pressure).toBe(0);
            expect(analysis.metrics.totalEvents).toBe(0);
            expect(analysis.issues.length).toBe(0);
        });
    });
    
    describe('Statistics', () => {
        it('should provide accurate stats', () => {
            observer.recordEvent({
                eventType: 'create',
                path: 'C:/Users/Alice/Downloads/file1.txt'
            });
            
            observer.recordEvent({
                eventType: 'create',
                path: 'C:/Users/Alice/Downloads/file2.txt'
            });
            
            observer.recordEvent({
                eventType: 'delete',
                path: 'C:/Users/Alice/Downloads/file1.txt'
            });
            
            const stats = observer.getStats();
            
            expect(stats.approvedFolders).toBe(2);
            expect(stats.totalEvents).toBe(3);
            expect(stats.eventsByType.create).toBe(2);
            expect(stats.eventsByType.delete).toBe(1);
            expect(stats.isObserving).toBe(false);
        });
    });
    
    describe('No Mutations (Gate Criterion)', () => {
        it('should not execute any filesystem operations', () => {
            // Observer should only read and record
            // No fs.rename, fs.unlink, fs.mkdir, etc.
            
            observer.recordEvent({
                eventType: 'create',
                path: 'C:/Users/Alice/Downloads/test.txt'
            });
            
            // Verify observer doesn't have execution methods
            expect(observer.executeOperation).toBeUndefined();
            expect(observer.moveFile).toBeUndefined();
            expect(observer.deleteFile).toBeUndefined();
        });
    });
    
    describe('No Exec Module (Gate Criterion)', () => {
        it('should not load executor', () => {
            // Verify FileExecutor is not imported/used
            expect(observer.executor).toBeUndefined();
            expect(observer.executeTimebox).toBeUndefined();
        });
    });
    
    describe('Runs Without Crashes (Gate Criterion)', () => {
        it('should handle large event volumes', () => {
            for (let i = 0; i < 10000; i++) {
                observer.recordEvent({
                    eventType: 'create',
                    path: `C:/Users/Alice/Downloads/file${i}.txt`
                });
            }
            
            expect(observer.eventLog.length).toBe(10000);
            
            const analysis = observer.calculatePressure('C:/Users/Alice/Downloads');
            expect(analysis.pressure).toBeDefined();
        });
        
        it('should handle invalid events gracefully', () => {
            // Missing fields
            observer.recordEvent({
                eventType: 'create'
                // path missing
            });
            
            // Should not crash
            expect(observer.eventLog.length).toBe(0);  // Event rejected
        });
    });
});

describe('Commit Type Validation', () => {
    it('should create valid FS_OBSERVED_EVENT commits', () => {
        const commitLog = {
            commits: [],
            append(commit) {
                this.commits.push(commit);
            }
        };
        
        const observer = new FileObserver(['C:/Users/Alice/Downloads'], commitLog);
        
        observer.recordEvent({
            eventType: 'create',
            path: 'C:/Users/Alice/Downloads/test.txt'
        });
        
        const commit = commitLog.commits[0];
        
        expect(commit.type).toBe(FS_OBSERVED_EVENT);
        expect(commit.eventType).toBe('create');
        expect(commit.path).toBe('C:/Users/Alice/Downloads/test.txt');
        expect(commit.timestamp).toBeDefined();
        expect(commit.scope).toBe('C:/Users/Alice/Downloads');
    });
});
