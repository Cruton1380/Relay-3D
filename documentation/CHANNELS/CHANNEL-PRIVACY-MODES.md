# Channel Privacy Modes

## Overview

The Relay Network supports two distinct channel privacy modes to balance transparency with security:

- **Public Channels**: Open, transparent voting with unencrypted broadcasts
- **Private Channels**: Secure, encrypted voting with Signal Protocol + Perfect Forward Secrecy

## Public Channels (Default)

### Characteristics
- **Transparency**: All vote results are publicly visible and verifiable
- **Open Access**: Any user can view channel content and vote results
- **Unencrypted Broadcasts**: Vote updates are broadcast in plaintext for system-wide transparency
- **Verifiability**: Vote counts and results can be independently verified by anyone

### Use Cases
- Public governance decisions
- Community polls
- Transparent organizational voting
- Public policy decisions
- Open-source project governance

### Technical Implementation
```javascript
// Channel creation (default behavior)
const publicChannel = {
  id: "channel-123",
  name: "Public Governance Vote",
  isPrivate: false,           // Default: public
  encryptionEnabled: false    // No encryption for transparency
};
```

### Vote Broadcasting
```javascript
// Public channels use unencrypted broadcasts
await broadcastToWebSocket(updateData, topic, voteTotals, 'public');
```

## Private Channels (Secure Rooms)

### Characteristics
- **Encryption**: All communications use Signal Protocol + Perfect Forward Secrecy
- **Access Control**: Only authorized members can view content and vote
- **Forward Secrecy**: Past messages become undecryptable when members leave
- **Group Sessions**: Each private channel maintains its own encryption session

### Use Cases
- Sensitive organizational decisions
- Private board meetings
- Confidential policy discussions
- Secure team voting
- Protected stakeholder decisions

### Technical Implementation
```javascript
// Private channel creation
const privateChannel = {
  id: "private-channel-456",
  name: "Board Executive Session",
  isPrivate: true,            // Enable privacy mode
  encryptionEnabled: true     // Enable Signal Protocol encryption
};
```

### Encryption Flow
1. **Group Session Creation**: When a private channel is created, a Signal Protocol group session is initialized
2. **Member Management**: Users are added to the encryption group when they join the channel
3. **Encrypted Broadcasting**: All vote updates are encrypted using the group's shared keys
4. **Forward Secrecy**: When members leave, the epoch increments and past messages become undecryptable

```javascript
// Private channel encryption flow
if (isChannelPrivate(topic)) {
  // Create encrypted broadcast
  const encryptionResult = await groupEncryption.encryptGroupMessage(
    topic,           // Channel ID as group ID
    'system',        // Sender ID
    JSON.stringify(updateData)
  );
  
  // Broadcast encrypted data
  await broadcastToWebSocket(encryptedUpdateData, topic, voteTotals, 'encrypted');
}
```

## Channel Mode Detection

The system automatically detects channel privacy mode using:

```javascript
function isChannelPrivate(topicId) {
  // Check channel name for privacy indicators
  return topicId.includes('private') || topicId.includes('secure');
  
  // In production, this would query the channel database:
  // const channel = await getChannelById(topicId);
  // return channel.isPrivate;
}
```

## Security Considerations

### Public Channels
- ✅ **Transparency**: Full system transparency and verifiability
- ✅ **Auditability**: All votes and results are publicly auditable
- ⚠️ **Privacy**: Vote choices are visible to all users
- ⚠️ **Manipulation**: Results are visible and could be influenced

### Private Channels
- ✅ **Privacy**: Vote choices are only visible to authorized members
- ✅ **Security**: Signal Protocol provides military-grade encryption
- ✅ **Forward Secrecy**: Past communications are protected even if keys are compromised
- ⚠️ **Transparency**: Results are not publicly verifiable
- ⚠️ **Trust**: Requires trust in channel administrators

## Migration and Compatibility

### Existing Channels
- All existing channels default to **public mode** for backward compatibility
- No encryption is applied to existing channels unless explicitly converted
- Vote history remains accessible and transparent

### Channel Conversion
```javascript
// Convert public channel to private
const channel = await getChannelById(channelId);
channel.isPrivate = true;
channel.encryptionEnabled = true;

// Initialize encryption for existing channel
await initializeGroupEncryption(channelId);
```

## Best Practices

### When to Use Public Channels
- Community governance decisions
- Public policy votes
- Transparent organizational decisions
- Open-source project governance
- Public opinion polling

### When to Use Private Channels
- Sensitive business decisions
- Personnel matters
- Confidential policy discussions
- Executive board decisions
- Protected stakeholder votes

### Security Recommendations
1. **Default to Public**: Use public channels unless privacy is specifically required
2. **Document Decisions**: Maintain clear records of why channels are private
3. **Regular Audits**: Periodically review private channel membership
4. **Access Controls**: Implement proper user authentication and authorization
5. **Key Management**: Ensure proper Signal Protocol key rotation and management

## API Reference

### Channel Creation
```javascript
POST /api/channels
{
  "name": "Channel Name",
  "description": "Channel description",
  "candidates": [...],
  "isPrivate": false,        // Optional: default false
  "encryptionEnabled": false // Optional: default matches isPrivate
}
```

### Channel Information
```javascript
GET /api/channels/:id
{
  "id": "channel-123",
  "name": "Channel Name",
  "isPrivate": false,
  "encryptionEnabled": false,
  "memberCount": 150,
  "totalVotes": 1250
}
```

### Vote Submission
```javascript
POST /api/vote/submitVote
{
  "topicId": "channel-123",
  "candidateId": "candidate-1",
  "userId": "user-456"
}
// Response varies based on channel privacy mode
```

## Troubleshooting

### Common Issues

**Q: Why are my vote updates not being broadcast?**
A: Check if the channel is private and encryption is failing. Private channels require successful encryption for broadcasts.

**Q: Can I convert a public channel to private?**
A: Yes, but existing vote history will remain public. Only new votes will be encrypted.

**Q: How do I verify vote results in private channels?**
A: Private channel results are only verifiable by channel members. Consider using public channels for results that need public verification.

**Q: What happens if encryption fails in a private channel?**
A: In development mode, the system falls back to unencrypted broadcast. In production mode, the vote update is blocked for security.

## Future Enhancements

- **Hybrid Channels**: Public results with private voting
- **Time-based Privacy**: Channels that become public after a certain time
- **Selective Transparency**: Public results but private individual votes
- **Audit Trails**: Enhanced logging for private channel activities
- **Key Escrow**: Optional key escrow for legal compliance
