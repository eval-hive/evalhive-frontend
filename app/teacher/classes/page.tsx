'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherClassesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/teacher/class');
  }, [router]);

  return null;
}
