export const profile = {
  name: '문승기',
  englishName: 'Moon Seung Gi',
  role: 'AI Engineer',
  headline: 'LLM·RAG·Agent 서비스와 문서 파싱·검색 시스템을 설계하고 구현하는 AI 엔지니어',
  introduction:
    '복잡한 업무 문제를 구조화하고, 검색과 추론이 실제 서비스 흐름으로 이어지도록 설계합니다. 모델 성능만이 아니라 데이터 품질, 평가, 운영까지 함께 봅니다.',
  contact: {
    email: 'moon010103@naver.com',
    github: 'https://github.com/tmdekd',
    velog: 'https://velog.io/@tmdekd/posts',
  },
  resume: { status: 'preparing' as const },
  career: [
    {
      company: '바이텍정보통신',
      team: '기술연구소',
      role: 'AI 개발자',
      period: '2026.04 — 현재',
      description: '전력산업 연구개발 과제·사업의 기획 및 수주 과정에 참여하며, 폐쇄망 환경을 고려한 AI 서비스의 기획·설계·개발을 수행하고 있습니다.',
    },
    {
      company: '아크릴',
      team: 'AI 연구개발',
      role: 'LLM 엔지니어 인턴',
      period: '2025.10 — 2026.03',
      description: 'LLM 기반 서비스 구현과 연구개발 업무를 수행했습니다.',
    },
  ],
  workflow: [
    { number: '01', title: '문제 분석', description: '사용자와 업무의 문제를 기능보다 먼저 정의합니다.' },
    { number: '02', title: '구조 설계', description: '데이터·검색·추론·응답 흐름을 연결해 설계합니다.' },
    { number: '03', title: '구현과 검증', description: '작게 구현하고 평가 기준으로 반복 검증합니다.' },
    { number: '04', title: '서비스 연결', description: '운영 환경과 사용 흐름까지 고려해 완성합니다.' },
  ],
  skills: [
    {
      group: 'LLM · RAG · Agent',
      description: '문서와 검색 데이터를 바탕으로 질문에 답하는 AI 서비스 흐름을 설계·구현합니다.',
      items: ['OpenAI API', 'LangChain', 'LangGraph', 'Fine-tuning', 'Reranking', 'Evaluation'],
    },
    {
      group: 'Backend · Data',
      description: 'AI 기능이 실제 서비스로 동작하도록 API와 데이터 흐름을 구현합니다.',
      items: ['Python', 'FastAPI', 'Django', 'PostgreSQL', 'FAISS', 'VectorDB', 'GraphDB'],
    },
    {
      group: 'Deployment · Operations',
      description: '개발 환경부터 배포·운영 흐름까지 연결합니다.',
      items: ['Docker', 'AWS', 'RunPod', 'GitHub Actions', 'CI/CD'],
    },
  ],
  education: [
    { label: '교육', value: 'SK네트웍스 Family AI 캠프 10기' },
    { label: '학습 분야', value: '생성형 AI · LLM · RAG · AI 서비스 개발' },
    { label: '활동', value: '팀 프로젝트 기반 서비스 기획·개발·발표' },
  ],
} as const;
