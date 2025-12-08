import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

const regions = [
  { id: 'tel-aviv', name: 'Tel Aviv Metropolitan Area', governance: 'Metropolitan council', level: 1 },
  { id: 'jerusalem', name: 'Jerusalem District', governance: 'District administration', level: 1 },
  { id: 'haifa', name: 'Haifa Metropolitan Area', governance: 'Metropolitan council', level: 1 },
  { id: 'beer-sheva', name: 'Beer Sheva Metropolitan Area', governance: 'Metropolitan council', level: 2 },
  { id: 'central', name: 'Central District', governance: 'District administration', level: 1 },
  { id: 'northern', name: 'Northern District', governance: 'District administration', level: 1 },
  { id: 'southern', name: 'Southern District', governance: 'District administration', level: 1 }
];

function generateRealisticContent(region, category) {
  const contents = {
    'Education': [
      `Leading educational reform at ${region.name}'s largest high school network. Implemented innovative Hebrew-English bilingual program showing 94% improvement in English proficiency. Partnering with Technion for STEM integration. Program includes IDF preparation and leadership development. Impact validated by ${Math.floor(Math.random() * 1000) + 500}+ students.`,
      `Developed special education program in ${region.name} focusing on technology integration. 85% of students successfully integrated into mainstream tech positions. Partnership with Intel Israel providing mentorship and internships. Expanding to 5 additional schools. ${Math.floor(Math.random() * 40) + 60}% success rate in key metrics.`,
      `Created unique education initiative in ${region.name} combining traditional knowledge with modern STEM. Program operating in 15 schools, reaching ${Math.floor(Math.random() * 3000) + 1000}+ students. 40% increase in university acceptance rates. Supported by leading academic institutions.`
    ],
    'Technology': [
      `Leading cybersecurity team protecting ${region.name}'s financial sector. Secured ${Math.floor(Math.random() * 2) + 1}M+ daily transactions, reduced fraud by 85%. Collaborating with Unit 8200 alumni on AI-driven threat detection. Expanding to national fintech sector.`,
      `Developed smart agriculture system deployed across ${region.name} farms. Reduced water usage by 40% while increasing crop yields by 35%. Using advanced satellite data for precision farming. Serving ${Math.floor(Math.random() * 200) + 100}+ agricultural operations.`,
      `Created breakthrough quantum computing solution at ${region.name}'s research center. Published in leading journals, featured at major tech conferences. Partnering with global tech companies. Training next generation of quantum engineers.`
    ],
    'Healthcare': [
      `Established largest telemedicine network in ${region.name} serving ${Math.floor(Math.random() * 50000) + 50000}+ patients. Integrated with major HMOs. Reduced specialist wait times by 70%. Special focus on underserved communities.`,
      `Leading innovative medical research at ${region.name}'s premier hospital. Clinical trials showing ${Math.floor(Math.random() * 20) + 30}% better outcomes. Collaborating with international institutions on breakthrough treatments.`,
      `Created mobile health initiative serving ${region.name}'s peripheral communities. Reached ${Math.floor(Math.random() * 10000) + 10000}+ patients in 2024. Specialized programs for diverse populations. Expanding coverage area.`
    ],
    'Community': [
      `Created innovative housing solution in ${region.name} for young professionals. ${Math.floor(Math.random() * 200) + 200}+ residents, 40% lower living costs. Integrated startup workspace and cultural center. Model for urban renewal.`,
      `Established mentorship program in ${region.name} connecting professionals with youth. ${Math.floor(Math.random() * 500) + 500}+ successful matches, 80% improvement in outcomes. Operating in multiple cities.`,
      `Leading neighborhood renewal project in ${region.name}. Restored historic buildings, created community spaces. ${Math.floor(Math.random() * 40) + 30}% increase in local business revenue. Model for urban development.`
    ]
  };

  const categoryContents = contents[category] || contents['Community'];
  return categoryContents[Math.floor(Math.random() * categoryContents.length)];
}

async function generateTestData() {
  const channels = [];
  const channelTypes = ['Education', 'Technology', 'Healthcare', 'Community'];
  
  // Generate 100 channels
  for (let i = 0; i < 100; i++) {
    const channelType = channelTypes[i % channelTypes.length];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const channelId = `channel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const totalVotes = Math.floor(Math.random() * 90000) + 10000;
    const candidates = [];
    
    // Generate candidates for this channel
    for (let j = 0; j < 500; j++) {
      const voteShare = j === 0 ? 0.2 : // Top candidate gets 20%
                       j < 5 ? 0.1 : // Next 4 get 10% each
                       j < 20 ? 0.02 : // Next 15 get 2% each
                       Math.exp(-j/100) / 100; // Rest decay exponentially
      
      const votes = Math.max(1, Math.floor(totalVotes * voteShare));
      const trend = j < 10 ? 'Rising' : (j < 30 ? 'Stable' : 'Falling');
      
      candidates.push({
        id: `candidate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        channelId,
        content: generateRealisticContent(region, channelType),
        votes,
        trend,
        location: {
          region: region.name,
          governance: region.governance,
          level: region.level
        },
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    channels.push({
      id: channelId,
      type: Math.random() < 0.7 ? 'proximity' : 'regional',
      name: `${channelType} Initiative`,
      category: channelType,
      totalVotes,
      candidates
    });
  }
  
  // Write to file
  await fs.writeFile(
    path.join(process.cwd(), 'data', 'demos', 'demo-voting-data.json'),
    JSON.stringify({ channels }, null, 2)
  );
  
  console.log('Test data generated successfully!');
  console.log(`Generated ${channels.length} channels with ${channels.length * 500} total candidates`);
}

generateTestData().catch(console.error); 