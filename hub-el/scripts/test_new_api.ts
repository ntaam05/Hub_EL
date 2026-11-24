import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
import { signAccessToken } from '../src/lib/jwt';

async function testEndpoints() {
  const token = signAccessToken({ id: 'cmp2zxzh80001vcv44u74w80o', email: 'hoangtam4472@gmail.com', role: 'admin' });
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  const quizRes = await fetch('http://localhost:3000/api/v1/learning/quizzes/history', { headers });
  const quizData = await quizRes.json();
  console.log('Quiz History:', quizRes.status, quizData);

  const courseRes = await fetch('http://localhost:3000/api/v1/courses', { headers });
  const courseData = await courseRes.json();
  console.log('Courses:', courseRes.status, courseData);

  const favRes = await fetch('http://localhost:3000/api/v1/videos/favorite', { headers });
  const favData = await favRes.json();
  console.log('Favorites:', favRes.status, favData);

  const statsRes = await fetch('http://localhost:3000/api/v1/stats', { headers });
  const statsData = await statsRes.json();
  console.log('Stats:', statsRes.status, statsData?.success, 'totalCards:', statsData?.data?.totalCards, 'totalFriends:', statsData?.data?.totalFriends);
}

testEndpoints();
