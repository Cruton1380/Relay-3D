# 🏛️ Democratic Chatroom System

Relay channels use democratic voting to govern what messages are shown, hidden, or elevated. Every message is treated like a mini proposal, subject to upvotes and downvotes by the community.

---

## 🗳️ Message Voting

- ✅ **Upvote**: Agree, support, or promote the message.
- ❌ **Downvote**: Disagree, suppress, or flag the message.

---

## ⚖️ Voting Rules

| Action     | Eligibility                              |
|------------|-------------------------------------------|
| Upvote     | All verified users                        |
| Downvote   | Users above 10th percentile in the channel|
| Self-vote  | ❌ Not allowed                            |
| Flagged    | ❌ Cannot vote                            |

Percentiles are calculated from recent up/downvotes and decay over time.

---

## 📈 Message Visibility

Messages are ranked by:
- Net votes
- Author reliability
- Time decay

Pinned messages require quorum. Hidden messages must hit downvote threshold.

---

## 👥 Quorum Triggers

| Action         | Quorum Requirement                     |
|----------------|-----------------------------------------|
| Hide message   | 100 downvotes or 10% of channel         |
| Pin message    | 100 upvotes or 10% of channel           |
| Kick user      | Jury system engagement                  |
| Elevate thread | Message reaches top 1% global rank      |

---

## ⏳ Reputation Decay

Your voting power fades if you stop participating. This keeps the system live, adaptive, and fair.

---

## 🧼 Abuse Protection

- Repeated mass voting cooldowns
- No voting in multiple tabs/sessions
- Behavior logged for jury review if needed

---

## 🔗 Word Linking (Semantic Layer)

Each word or phrase in a message can be clicked to explore its meaning via topic rows and candidate channels.

---

## 🔧 Implementation Details

### Core Features Implemented

✅ **Message Voting System**
- Upvotes/downvotes on every message
- Vote type, voter ID, timestamp, and message ID stored in vote log
- Real-time vote aggregation and net score calculation

✅ **Voting Eligibility Rules**
- **Upvote**: Any verified user can upvote. Upvoter doesn't lose points, target gains +1
- **Downvote**: Only users at or above 10th percentile. Both voter and target lose -1 (mutual cost)
- **Self-vote**: Blocked
- **Cooldowns**: 1-second minimum between votes to prevent spam

✅ **User Percentile System**
- Percentile recalculated after every vote
- Based on net score (upvotes received - downvotes received)
- All voters and vote targets added to scoring system for accurate percentiles
- Single users get 0th percentile (cannot downvote alone)

✅ **Message Visibility Logic**
- Messages ranked by net vote score
- Quorum-based pinning and hiding
- Author reputation affects message visibility

✅ **Quorum-Based Triggers**
- **Hide message**: 100 downvotes or 10% of active users
- **Pin message**: 100 upvotes or 10% of active users  
- **Escalate thread**: Top 1% message ranking
- **Auto-escalate**: Channel-defined thresholds

✅ **Participation Decay**
- 20% reputation decay per week to ensure recent activity matters
- Decay interval properly managed to prevent hanging processes

✅ **Anti-Spam / Abuse Rules**
- Self-voting blocked
- Vote cooldowns (1 second between votes)
- User activity tracking for monitoring

✅ **Semantic Integration Ready**
- Framework supports word-level linking to topic rows
- Message escalation system for highly-voted content

### Channel Governance Parameters

Each channel can configure these parameters via **Community Vote** or **Channel Creator** decision:

| Parameter | Description | Default | Governance |
|-----------|-------------|---------|------------|
| Moderation Threshold | Percentile required for downvoting | 10th | Community/Creator |
| Filter Threshold | Score below which messages are hidden | -10 | Community/Creator |
| Pin Quorum | Votes needed to pin a message | 100 or 10% | Community/Creator |
| Hide Quorum | Votes needed to hide a message | 100 or 10% | Community/Creator |
| Reputation Decay | Weekly decay rate for user scores | 20% | Community/Creator |
| Cooldown Period | Minimum time between votes | 1 second | Community/Creator |

### Channel Types & Behaviors

**🗣️ Chatroom (Real-time Debate)**
- Live message voting and ranking
- Real-time percentile updates
- Instant moderation actions
- WebSocket integration for live updates

**📋 Newsfeed (Door Postings)**
- Longer-form content with sustained voting
- Time-decay algorithms for aging content
- Cross-channel content promotion
- Semantic word linking for discoverability

**🌍 Global Marketplace of Ideas**
- Channels compete for attention and participants
- High-quality content can escalate to broader audiences
- Jury system integration for complex disputes
- 3D visualization of channel networks and relationships

### Technical Integration Points

**🔌 WebSocket Events**
- `chat:user-score-updated` - Real-time score changes
- `chat:message-vote-updated` - Live vote aggregation
- `chat:moderation-threshold-updated` - Governance changes
- `chat:message-pinned` - Quorum-triggered pins
- `chat:message-hidden` - Quorum-triggered hiding
- `chat:message-escalated` - Thread creation triggers

**📊 3D Visualization**
- User percentile badges and rankings
- Message vote visualizations
- Channel participation heatmaps
- Network effects of viral content

**🎯 Temporary Pinning & Badges**
- Messages can be temporarily pinned via quorum
- Users earn badges based on percentile tiers
- Special badges for consistent quality contributors
- Time-limited promotional pins for events

**⚖️ Jury System Integration**
- Complex disputes escalate to jury review
- Voting patterns analyzed for Sybil detection
- Community standards enforcement
- Appeal processes for moderation actions

---

## 🚀 Future Enhancements

- **Advanced Quorum Logic**: Dynamic thresholds based on channel activity
- **Cross-Channel Voting**: Allow trusted users to vote across channels
- **Sentiment Analysis**: AI-assisted content quality scoring
- **Seasonal Campaigns**: Special voting events and challenges
- **Integration APIs**: External services can participate in governance
- **Mobile Optimization**: Battery-aware voting and caching
- **Offline Sync**: Vote queuing for intermittent connectivity

---

## 📋 Deployment Checklist

- ✅ Message voting system with upvote/downvote
- ✅ Percentile-based downvoting restrictions  
- ✅ Quorum triggers for pin/hide actions
- ✅ User reputation tracking with decay
- ✅ Anti-spam cooldowns and self-vote prevention
- ✅ Real-time WebSocket event emissions
- ✅ Channel governance parameter configuration
- ✅ Integration with existing Relay architecture
- 🔄 Frontend UI components for voting interface
- 🔄 3D visualization of voting patterns
- 🔄 Mobile app integration
- 🔄 Semantic word linking implementation
- 🔄 Advanced jury system integration

---

*The Democratic Chatroom System transforms every channel into a living, breathing Roman quorum where the best ideas rise to the top through collective wisdom and participation.*
