export const speakingScenarios = [
  {
    id: "coffee-order",
    title: "Gọi món ở quán cà phê",
    category: "Đời sống",
    topic: "Ordering at a cafe",
    learnerRole: "Khách gọi món",
    alexRole: "Nhân viên quán",
    goal: "Gọi một đồ uống, chọn kích cỡ và hỏi giá.",
    context:
      "AI Lead is a cafe barista. The learner is a customer ordering a drink. Practice choosing a drink, size, and asking the price; never invent the learner's choices. Use fictional prices only when needed.",
    phrases: ["I'd like…", "Can I have…?", "How much is it?"],
  },
  {
    id: "work-update",
    title: "Cập nhật công việc",
    category: "Công việc",
    topic: "A short work update",
    learnerRole: "Thành viên trong nhóm",
    alexRole: "Đồng nghiệp",
    goal: "Kể việc đã làm, nói bước tiếp theo và nhờ hỗ trợ.",
    context:
      "AI Lead is a friendly teammate in a short work check-in. The learner explains a task, what is done, and the next step or a blocker. Ask about their actual work without assuming their job or employer; use fictional project details when needed.",
    phrases: ["I've finished…", "Next, I'll…", "Could you help me with…?"],
  },
  {
    id: "hotel-checkin",
    title: "Nhận phòng khách sạn",
    category: "Du lịch",
    topic: "Checking in at a hotel",
    learnerRole: "Khách nhận phòng",
    alexRole: "Lễ tân",
    goal: "Hỏi về phòng, giờ nhận phòng và bữa sáng.",
    context:
      "AI Lead is a hotel receptionist and the learner is a guest checking in. Practice reservation, check-in time and breakfast questions. Keep booking details fictional and never request real passport, payment or reservation identifiers.",
    phrases: ["I have a reservation.", "What time is…?", "Is breakfast included?"],
  },
  {
    id: "job-introduction",
    title: "Giới thiệu trong phỏng vấn",
    category: "Công việc",
    topic: "Introducing yourself in a job interview",
    learnerRole: "Ứng viên",
    alexRole: "Người phỏng vấn",
    goal: "Giới thiệu ngắn gọn và kể một kinh nghiệm của bạn.",
    context:
      "AI Lead is a supportive interviewer. Help the learner introduce their work or interests and describe one real example from their experience. Ask one short question at a time. Do not invent qualifications or guarantee interview outcomes.",
    phrases: ["I work as…", "I'm interested in…", "For example,…"],
  },
] as const;
