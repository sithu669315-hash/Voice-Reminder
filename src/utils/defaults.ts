import { Task } from '../types';

export const getInitialTasks = (): Task[] => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  
  // Create sample dates
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  return [
    {
      id: 1729001,
      title: 'နံနက်ခင်း ရေတစ်ဖန်ခွက်သောက်ရန်',
      date: today,
      time: '07:30',
      category: 'ကျန်းမာရေး',
      priority: 'high',
      ttsMessage: 'မင်္ဂလာနံနက်ခင်းပါ။ ကျန်းမာရေးအတွက် ရေတစ်ဖန်ခွက်သောက်ရန် အချိန်တန်ပါပြီ။',
      completed: true,
      completedAt: `${today}T07:35:00.000Z`,
      notified: true,
    },
    {
      id: 1729002,
      title: 'အပတ်စဉ် အလုပ်အဖွဲ့ အစည်းအဝေး တက်ရောက်ရန်',
      date: today,
      time: '09:30',
      category: 'အလုပ်',
      priority: 'high',
      ttsMessage: 'အလုပ်အဖွဲ့ အစည်းအဝေး စတင်တော့မည်ဖြစ်၍ ပြင်ဆင်ထားပါ။',
      completed: true,
      completedAt: `${today}T10:15:00.000Z`,
      notified: true,
    },
    {
      id: 1729003,
      title: 'နေ့လယ်စာ စားပြီး အနားယူရန်',
      date: today,
      time: '12:30',
      category: 'ကိုယ်ရေးကိုယ်တာ',
      priority: 'medium',
      ttsMessage: 'နေ့လယ်စာ စားသုံးရန်နှင့် ခေတ္တအနားယူရန် အချိန်ရောက်ပါပြီ။',
      completed: false,
      completedAt: null,
      notified: false,
    },
    {
      id: 1729004,
      title: 'နည်းပညာနှင့် အင်္ဂလိပ်စာ ဆောင်းပါး ဖတ်ရှုရန်',
      date: today,
      time: '15:00',
      category: 'ပညာရေး',
      priority: 'low',
      ttsMessage: 'ဗဟုသုတတိုးပွားရေးအတွက် စာဖတ်ရန် အချိန်ကျရောက်ပါပြီ။',
      completed: false,
      completedAt: null,
      notified: false,
    },
    {
      id: 1729005,
      title: 'ညနေခင်း ကိုယ်လက်လှုပ်ရှား လေ့ကျင့်ခန်း ပြုလုပ်ရန်',
      date: today,
      time: '17:30',
      category: 'ကျန်းမာရေး',
      priority: 'medium',
      ttsMessage: 'ကိုယ်လက်လှုပ်ရှား လေ့ကျင့်ခန်း လုပ်ဆောင်ရန် အချိန်တန်ပါပြီ။',
      completed: false,
      completedAt: null,
      notified: false,
    },
    {
      id: 1729006,
      title: 'မနက်ဖြန်အတွက် အစီအစဉ် ရေးဆွဲရန်',
      date: tomorrowStr,
      time: '20:00',
      category: 'အလုပ်',
      priority: 'medium',
      ttsMessage: 'မနက်ဖြန် လုပ်ဆောင်ဖွယ်များကို ကြိုတင် စီစဉ်ထားပါ။',
      completed: false,
      completedAt: null,
      notified: false,
    },
    {
      id: 1729007,
      title: 'မနေ့က စာရင်းဇယား အစီရင်ခံစာ ပေးပို့ခြင်း',
      date: yesterdayStr,
      time: '16:00',
      category: 'အလုပ်',
      priority: 'high',
      ttsMessage: 'စာရင်းဇယား အစီရင်ခံစာ ပေးပို့ပြီးပါပြီ။',
      completed: true,
      completedAt: `${yesterdayStr}T16:05:00.000Z`,
      notified: true,
    },
  ];
};
