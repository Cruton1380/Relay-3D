/**
 * @fileoverview Test Encounter History System
 * Comprehensive test for Phase 2 implementation
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import EncounterHistoryService from '../src/backend/channel-service/encounterHistory.mjs';

describe('Encounter History System Tests', () => {

  let encounterHistory;
  const testUserId = 'test-user-123';
  const testChannelId = 'test-channel-456';
  const testChannelData = {
    id: testChannelId,
    name: 'Test Proximity Channel',
    description: 'A test channel for encounter history',
    type: 'proximity',
    creatorId: 'creator-123',
    isOfficial: false,
    memberCount: 5  };
  const testLocation = { lat: 40.7128, lon: -74.0060 };
  beforeAll(async () => {
    encounterHistory = (await import('../src/backend/channel-service/encounterHistory.mjs')).default;
    await encounterHistory.initialize();
  });

  afterAll(async () => {
    if (encounterHistory) {
      await encounterHistory.shutdown();
    }
  });
  describe('Encounter Recording', () => {
    it('should record a new encounter successfully', async () => {
      const interaction = {
        messagesSent: 5,
        messagesReceived: 12,
        reactionsGiven: 3,
        reactionsReceived: 7,
        repliesSent: 2,
        repliesReceived: 4
      };

      const encounter = await encounterHistory.recordEncounter(
        testUserId,
        testChannelId,
        testChannelData,
        testLocation,
        300000, // 5 minutes
        interaction
      );

      expect(encounter).to.be.an('object');
      expect(encounter.id).to.be.a('string');
      expect(encounter.userId).to.equal(testUserId);
      expect(encounter.channelId).to.equal(testChannelId);
      expect(encounter.channelName).to.equal(testChannelData.name);
      expect(encounter.duration).to.equal(300000);
      expect(encounter.interaction.messagesSent).to.equal(5);
      expect(encounter.location.latitude).to.equal(40.7128);
      expect(encounter.location.longitude).to.equal(-74.0060);
    });

    it('should archive channel data during encounter recording', async () => {
      // Record another encounter for the same channel
      await encounterHistory.recordEncounter(
        'another-user',
        testChannelId,
        testChannelData,
        { lat: 40.7130, lon: -74.0058 },
        180000, // 3 minutes
        { messagesSent: 2, reactionsGiven: 1 }
      );

      // Check if channel is archived
      const archivedChannel = encounterHistory.archivedChannels.get(testChannelId);
      expect(archivedChannel).to.be.an('object');
      expect(archivedChannel.name).to.equal(testChannelData.name);
      expect(archivedChannel.totalEncounters).to.be.at.least(2);
      expect(archivedChannel.status).to.equal('archived');
    });
  });
  describe('Encounter History Retrieval', () => {
    it('should retrieve user encounter history', () => {
      const result = encounterHistory.getUserEncounters(testUserId);
      
      expect(result).to.be.an('object');
      expect(result.encounters).to.be.an('array');
      expect(result.total).to.be.a('number');
      expect(result.hasMore).to.be.a('boolean');
      expect(result.encounters.length).to.be.at.least(1);
      
      const encounter = result.encounters[0];
      expect(encounter.userId).to.equal(testUserId);
      expect(encounter.channelId).to.equal(testChannelId);
    });

    it('should filter encounters by date range', function() {
      const yesterday = Date.now() - 24 * 60 * 60 * 1000;
      const tomorrow = Date.now() + 24 * 60 * 60 * 1000;
      
      const result = encounterHistory.getUserEncounters(testUserId, {
        startDate: yesterday,
        endDate: tomorrow
      });
      
      expect(result.encounters).to.be.an('array');
      expect(result.encounters.length).to.be.at.least(1);
    });

    it('should filter encounters by channel type', function() {
      const result = encounterHistory.getUserEncounters(testUserId, {
        channelType: 'proximity'
      });
      
      expect(result.encounters).to.be.an('array');
      expect(result.encounters.length).to.be.at.least(1);
      expect(result.encounters[0].channelType).to.equal('proximity');
    });

    it('should sort encounters correctly', function() {
      const resultDesc = encounterHistory.getUserEncounters(testUserId, {
        sortBy: 'timestamp',
        sortOrder: 'desc'
      });
      
      if (resultDesc.encounters.length > 1) {
        expect(resultDesc.encounters[0].timestamp).to.be.at.least(
          resultDesc.encounters[1].timestamp
        );
      }
      
      const resultAsc = encounterHistory.getUserEncounters(testUserId, {
        sortBy: 'timestamp',
        sortOrder: 'asc'
      });
      
      if (resultAsc.encounters.length > 1) {
        expect(resultAsc.encounters[0].timestamp).to.be.at.most(
          resultAsc.encounters[1].timestamp
        );
      }
    });
  });

  describe('Location-Based Search', function() {
    it('should find encounters within search radius', function() {
      const searchLocation = { lat: 40.7129, lon: -74.0059 }; // Very close to test location
      const encounters = encounterHistory.searchEncountersByLocation(
        testUserId,
        searchLocation,
        1000 // 1km radius
      );
      
      expect(encounters).to.be.an('array');
      expect(encounters.length).to.be.at.least(1);
      
      const encounter = encounters[0];
      expect(encounter.distance).to.be.a('number');
      expect(encounter.distance).to.be.lessThan(1000);
    });

    it('should not find encounters outside search radius', function() {
      const farLocation = { lat: 34.0522, lon: -118.2437 }; // Los Angeles
      const encounters = encounterHistory.searchEncountersByLocation(
        testUserId,
        farLocation,
        1000 // 1km radius
      );
      
      expect(encounters).to.be.an('array');
      expect(encounters.length).to.equal(0);
    });

    it('should filter location search by channel type', function() {
      const encounters = encounterHistory.searchEncountersByLocation(
        testUserId,
        testLocation,
        5000,
        { channelType: 'proximity' }
      );
      
      expect(encounters).to.be.an('array');
      encounters.forEach(encounter => {
        expect(encounter.channelType).to.equal('proximity');
      });
    });
  });

  describe('Channel Statistics', function() {
    it('should calculate channel encounter statistics', function() {
      const stats = encounterHistory.getChannelEncounterStats(testChannelId);
      
      expect(stats).to.be.an('object');
      expect(stats.channelId).to.equal(testChannelId);
      expect(stats.totalEncounters).to.be.a('number');
      expect(stats.uniqueUsers).to.be.a('number');
      expect(stats.averageDuration).to.be.a('number');
      expect(stats.totalDuration).to.be.a('number');
      expect(stats.interactionStats).to.be.an('object');
      expect(stats.popularTimes).to.be.an('array');
    });

    it('should return zero stats for non-existent channel', function() {
      const stats = encounterHistory.getChannelEncounterStats('non-existent-channel');
      
      expect(stats.totalEncounters).to.equal(0);
      expect(stats.uniqueUsers).to.equal(0);
      expect(stats.averageDuration).to.equal(0);
    });
  });

  describe('Read-Only Channel Access', function() {
    it('should grant read-only access for encountered channels', async function() {
      const accessData = await encounterHistory.getReadOnlyChannelAccess(
        testUserId,
        testChannelId
      );
      
      expect(accessData).to.be.an('object');
      expect(accessData.channel).to.be.an('object');
      expect(accessData.readOnly).to.be.true;
      expect(accessData.userEncounters).to.be.an('array');
      expect(accessData.permissions).to.be.an('object');
      expect(accessData.permissions.canRead).to.be.true;
      expect(accessData.permissions.canWrite).to.be.false;
      expect(accessData.permissions.canReact).to.be.false;
    });

    it('should deny read-only access for non-encountered channels', async function() {
      try {
        await encounterHistory.getReadOnlyChannelAccess(
          testUserId,
          'never-encountered-channel'
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('No encounter history found');
      }
    });

    it('should deny access for users who never encountered the channel', async function() {
      try {
        await encounterHistory.getReadOnlyChannelAccess(
          'never-visited-user',
          testChannelId
        );
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('No encounter history found');
      }
    });
  });

  describe('Data Persistence', function() {
    it('should save and load encounter data correctly', async function() {
      const beforeSave = encounterHistory.encounters.size;
      
      await encounterHistory.saveData();
        // Create a new instance and load data
      const newInstance = (await import('../src/backend/channel-service/encounterHistory.mjs')).default;
      await newInstance.initialize();
      
      expect(newInstance.encounters.size).to.equal(beforeSave);
      expect(newInstance.userEncounters.has(testUserId)).to.be.true;
      expect(newInstance.archivedChannels.has(testChannelId)).to.be.true;
      
      await newInstance.shutdown();
    });
  });
  describe('Service Management', function() {
    it('should provide service statistics', async function() {
      // Ensure service is initialized
      if (!encounterHistory.initialized) {
        await encounterHistory.initialize();
      }
      
      const stats = encounterHistory.getServiceStats();
      
      expect(stats).to.be.an('object');
      expect(stats.totalEncounters).to.be.a('number');
      expect(stats.totalUsers).to.be.a('number');
      expect(stats.totalChannels).to.be.a('number');
      expect(stats.archivedChannels).to.be.a('number');
      expect(stats.initialized).to.be.true;
      expect(stats.maxEncounterAge).to.be.a('number');
      expect(stats.cleanupInterval).to.be.a('number');
    });

    it('should cleanup old encounters', async function() {
      // Ensure service is initialized
      if (!encounterHistory.initialized) {
        await encounterHistory.initialize();
      }
      
      // Record an old encounter (simulate old timestamp)
      const oldEncounter = {
        id: 'old-encounter-123',
        userId: testUserId,
        channelId: 'old-channel',
        timestamp: Date.now() - (40 * 24 * 60 * 60 * 1000), // 40 days ago
        duration: 60000,
        interaction: { messagesSent: 1 }
      };
      
      encounterHistory.encounters.set(oldEncounter.id, oldEncounter);
      
      const beforeCleanup = encounterHistory.encounters.size;
      await encounterHistory.cleanupOldEncounters();
      const afterCleanup = encounterHistory.encounters.size;
      
      expect(afterCleanup).to.be.lessThan(beforeCleanup);
      expect(encounterHistory.encounters.has(oldEncounter.id)).to.be.false;
    });
  });

  describe('Distance Calculation', function() {
    it('should calculate distances correctly', function() {
      const loc1 = { lat: 40.7128, lon: -74.0060 }; // NYC
      const loc2 = { lat: 40.7589, lon: -73.9851 }; // Times Square
      
      const distance = encounterHistory.calculateDistance(loc1, loc2);
      
      expect(distance).to.be.a('number');
      expect(distance).to.be.greaterThan(0);
      expect(distance).to.be.lessThan(10000); // Should be less than 10km
    });

    it('should return zero distance for identical locations', function() {
      const loc = { lat: 40.7128, lon: -74.0060 };
      const distance = encounterHistory.calculateDistance(loc, loc);
      
      expect(distance).to.equal(0);
    });
  });
});

console.log('✅ Encounter History System - Phase 2 tests completed successfully!');






