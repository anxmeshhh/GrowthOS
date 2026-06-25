from django.core.mail import send_mail
from django.conf import settings


def _send(subject, body_html, body_text, to_email):
    send_mail(
        subject=subject,
        message=body_text,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[to_email],
        html_message=body_html,
        fail_silently=False,
    )


def _base(content_html, preview_text=""):
    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{{margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;color:#e5e5e5}}
  .wrap{{max-width:560px;margin:32px auto;background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden}}
  .header{{background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px 32px}}
  .header h1{{margin:0;font-size:22px;color:#fff;letter-spacing:-0.3px}}
  .header p{{margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.7)}}
  .body{{padding:28px 32px}}
  .stat-row{{display:flex;gap:12px;margin:20px 0}}
  .stat{{flex:1;background:#242424;border:1px solid #2f2f2f;border-radius:8px;padding:16px;text-align:center}}
  .stat .num{{font-size:28px;font-weight:700;color:#a78bfa}}
  .stat .lbl{{font-size:12px;color:#888;margin-top:2px}}
  .section{{margin:20px 0}}
  .section-title{{font-size:11px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px}}
  .item{{background:#242424;border:1px solid #2f2f2f;border-radius:8px;padding:12px 16px;margin-bottom:8px;font-size:14px;color:#ccc}}
  .item strong{{color:#e5e5e5}}
  .cta{{display:block;margin:24px 0 4px;padding:14px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;text-align:center;font-weight:600;font-size:15px}}
  .footer{{padding:20px 32px;border-top:1px solid #222;font-size:12px;color:#555;text-align:center}}
  .badge{{display:inline-block;background:#7c3aed22;border:1px solid #7c3aed55;color:#a78bfa;border-radius:20px;padding:3px 10px;font-size:12px;font-weight:600}}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>GrowthOS</h1>
    <p>{preview_text}</p>
  </div>
  <div class="body">{content_html}</div>
  <div class="footer">
    You're receiving this because you have a GrowthOS account.<br>
    <a href="https://growth-os.tech/settings" style="color:#7c3aed">Manage email preferences</a>
  </div>
</div>
</body>
</html>"""


def send_daily_briefing(user, due_cards, streak, next_topic, fading_topics):
    name = user.first_name or user.username

    streak_badge = f'<span class="badge">🔥 {streak}-day streak</span>' if streak > 0 else ''

    stats_html = f"""
    <div class="stat-row">
      <div class="stat"><div class="num">{due_cards}</div><div class="lbl">Cards Due</div></div>
      <div class="stat"><div class="num">{streak}</div><div class="lbl">Day Streak</div></div>
    </div>"""

    next_html = ""
    if next_topic:
        next_html = f"""
        <div class="section">
          <div class="section-title">Pick up where you left off</div>
          <div class="item"><strong>{next_topic['title']}</strong></div>
        </div>"""

    fading_html = ""
    if fading_topics:
        items = "".join(f'<div class="item">{t["title"]}</div>' for t in fading_topics[:3])
        fading_html = f"""
        <div class="section">
          <div class="section-title">Fading — revisit soon</div>
          {items}
        </div>"""

    due_line = f"You have <strong>{due_cards} flashcard{'s' if due_cards != 1 else ''}</strong> due for review today." if due_cards else "No flashcards due today — great job staying on top of it!"

    content = f"""
    <p style="font-size:16px;margin-top:0">Good morning, <strong>{name}</strong> {streak_badge}</p>
    <p style="color:#888;font-size:14px">{due_line}</p>
    {stats_html}
    {next_html}
    {fading_html}
    <a class="cta" href="https://growth-os.tech/dashboard">Open GrowthOS</a>
    """

    plain = (
        f"Good morning {name}!\n\n"
        f"Streak: {streak} days\n"
        f"Flashcards due: {due_cards}\n"
        + (f"Next topic: {next_topic['title']}\n" if next_topic else "")
        + "\nOpen GrowthOS: https://growth-os.tech/dashboard"
    )

    _send(
        subject=f"Your GrowthOS briefing — {due_cards} card{'s' if due_cards != 1 else ''} due today",
        body_html=_base(content, "Your daily learning snapshot"),
        body_text=plain,
        to_email=user.email,
    )


def send_streak_warning(user, streak):
    name = user.first_name or user.username

    content = f"""
    <p style="font-size:16px;margin-top:0">Hey <strong>{name}</strong>, don't break your streak!</p>
    <div class="stat-row">
      <div class="stat"><div class="num">{streak}</div><div class="lbl">Day Streak at Risk</div></div>
    </div>
    <p style="color:#888;font-size:14px">
      You haven't logged in today. Your <strong>{streak}-day streak</strong> will reset at midnight if you don't check in.
      It only takes 30 seconds.
    </p>
    <a class="cta" href="https://growth-os.tech/dashboard">Save my streak</a>
    """

    plain = (
        f"Hey {name}! Your {streak}-day streak is at risk.\n"
        "Log in before midnight to keep it alive.\n\n"
        "Open GrowthOS: https://growth-os.tech/dashboard"
    )

    _send(
        subject=f"Your {streak}-day streak expires tonight",
        body_html=_base(content, f"Log in before midnight to keep your {streak}-day streak"),
        body_text=plain,
        to_email=user.email,
    )


def send_milestone_email(user, milestone_days):
    name = user.first_name or user.username

    messages = {
        7:  ("One week strong!", "You've built a real habit. Keep the momentum going."),
        14: ("Two weeks in!", "Consistency is the hardest part — you're doing it."),
        30: ("30 days. That's huge.", "A full month of daily learning. You're in the top 1% of learners."),
    }
    title, subtitle = messages.get(milestone_days, (f"{milestone_days}-day streak!", "Keep going."))

    content = f"""
    <p style="font-size:24px;font-weight:700;margin-top:0;color:#a78bfa">🔥 {milestone_days} Days</p>
    <p style="font-size:18px;font-weight:600;color:#e5e5e5;margin:4px 0">{title}</p>
    <p style="color:#888;font-size:14px">{subtitle}</p>
    <div class="stat-row">
      <div class="stat"><div class="num">{milestone_days}</div><div class="lbl">Day Streak</div></div>
    </div>
    <p style="color:#888;font-size:13px">Keep showing up every day — that's all it takes.</p>
    <a class="cta" href="https://growth-os.tech/dashboard">Keep the streak alive</a>
    """

    plain = (
        f"Congrats {name}! You hit a {milestone_days}-day streak on GrowthOS.\n"
        f"{title} {subtitle}\n\n"
        "Open GrowthOS: https://growth-os.tech/dashboard"
    )

    _send(
        subject=f"🔥 {milestone_days}-day streak — {title}",
        body_html=_base(content, f"You hit a {milestone_days}-day learning streak"),
        body_text=plain,
        to_email=user.email,
    )
