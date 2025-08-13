export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  testimonials: Array<{
    achievement: string;
    quote: string;
  }>;
}

export const testimonialsData: Testimonial[] = [
  {
    id: "leora",
    name: "Leora",
    avatar:
      "https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f73/6855292ece9c33e8d67b947d_Screenshot%202025-06-20%20172556.png",
    testimonials: [
      {
        achievement: "D to A - GP",
        quote:
          "When I first entered JC, General Paper felt like an insurmountable challenge. My tutor: Zach - the most patient and engaging tutor ever. He transformed what used to be tedious case study memorization into a bank of hilariously effective examples that made essay-writing so much easier. His targeted practices and additional consults helped me clarify misconceptions, refine my thought process, and actually enjoy GP. I'm beyond grateful to Zach for being such a crucial part of my JC journey!",
      },
    ],
  },
  {
    id: "Fionn",
    name: "Fionn",
    avatar:
      "https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f73/68518e04ed2f9834d15663ac_Fionn%20Lim%20Hui%20Ying_Square.webp",
    testimonials: [
      {
        achievement: "C to A - Econs",
        quote:
          "Before joining Zenith, my grades were stagnant, but my passionate tutors made all the difference. Thanks to their support, I improved and performed better in my A-levels!",
      },
    ],
  },
  {
    id: "Sven",
    name: "Sven",
    avatar:
      "https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f73/68518da0ca0e589ab5ba0e03_Sven_Square.webp",
    testimonials: [
      {
        achievement: "E to A - Econs, D to A - GP",
        quote:
          "Zenith’s lessons in Econs and GP really sparked my interest and helped me understand global issues better. The fun teaching style and personalized approach made a big difference in both my grades and critical thinking skills.",
      },
    ],
  },
  {
    id: "Gao Shan",
    name: "Gao Shan",
    avatar:
      "https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f73/68518dcc2e4818b52d9ad58e_Gao%20Shan_Square.webp",
    testimonials: [
      {
        achievement: "S to A - Chem, E to A - Econs",
        quote:
          "I discovered Zenith during their June holiday crash courses in Economics and Chemistry, where engaging teachers simplified complex concepts. Their guidance helped me achieve consistent A grades, making the experience both enjoyable and rewarding.",
      },
    ],
  },
  {
    id: "kit-kaye",
    name: "Kit Kaye",
    avatar:
      "https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f73/68552294f18d2bd8a0a4bb86_Screenshot%202025-06-20%20165746.png",
    testimonials: [
      {
        achievement: "U to A - Physics",
        quote:
          "I can confidently say that Duncan played a pivotal role in my academic journey-helping me go from a U to an A in Physics. He's an exceptional teacher: always responsive to my questions and willing to go the extra mile to ensure I fully understand the material. His teaching is clear, engaging, and makes even the most complex concepts easy to grasp. Duncan's dedication to his students is truly evident, and I'm incredibly grateful for his unwavering support throughout. I couldn't have achieved this without his guidance. Highly recommended!",
      },
    ],
  },
  {
    id: "Chavons",
    name: "Chavons",
    avatar:
      "https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f73/68518c10e858c6c8d95a3596_Chavonz%20Foo_Square.webp",
    testimonials: [
      {
        achievement: "E to A - Physics",
        quote:
          "Joining Zenith was a game changer! With my tutor’s guidance and clear notes, I went from an E to an A in A-level Physics.",
      },
    ],
  },
  {
    id: "Nicole",
    name: "Nicole",
    avatar:
      "https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f73/68518b9980e50abb3c88234e_Nicole%20Tay_Square.webp",
    testimonials: [
      {
        achievement: "D to A - Bio",
        quote:
          "Before joining Zenith, I didn’t really know how to study for bio and wasn’t seeing results despite the effort. My tutor helped push my grades from a D to an A in a short time, and her support made a big difference!",
      },
    ],
  },
  {
    id: "gloria",
    name: "Gloria",
    avatar:
      "https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f73/685509c6fb9942e9b642af7b_Screenshot%202025-06-20%20151153.png",
    testimonials: [
      {
        achievement: "U to A - Bio",
        quote:
          "I took H2 Biology tuition with Derek Tan in 2024, and he was the most nurturing tutor I've ever had. His sharpness, attentiveness, and deep expertise completely transformed my learning experience. Before joining his class, I struggled with exams despite doing well in discussions. Derek patiently analysed my weaknesses and helped me develop practical strategies to improve. His structured and clear teaching approach helped me gain confidence in the subject.",
      },
    ],
  },
  {
    id: "Lee Joon",
    name: "Lee Joon",
    avatar:
      "https://cdn.prod.website-files.com/65e18b0d9682c5d7b41c0f73/68550ee55a1ff90fbedb547c_Screenshot%202025-06-20%20153347.png",
    testimonials: [
      {
        achievement: "D to A - Math",
        quote:
          'When I first joined Kevin for a trial class in J1, I was skeptical about how productive the lessons would be, but I’m glad I gave it a shot. Kevin’s lessons are fun and engaging. He shares success stories to motivate us, and his lessons are well-paced, clear, and meaningful. Every time I leave his class, I’ve learned something crucial that played a big role in my performance during Prelims and A-Levels. Kevin also shares a "quote of the week" as he counts down the weeks to A-Levels. On a personal level, I’m truly grateful for how he answered all my Math questions throughout J2, especially as I ramped up the number of papers I was doing. I really appreciate his constant support!',
      },
    ],
  },
];
