import re

file_path = r"c:\Users\Animesh\Desktop\GrowthOS\frontend\src\routes\topic.$topicId.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We need to restructure the body.
# Currently:
#       <MasteryChecklist ... />
#       {/* ── Body ── */}
#       <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
#         {/* ════ LEFT: Screenshots ════ */}
#         <section ...> ... </section>
#         {/* ════ RIGHT: Workspace ════ */}
#         <section className="flex-1 flex bg-[#080808] min-h-0 overflow-hidden">
#           <div className="w-16 sm:w-56 shrink-0 border-r border-[#131313] bg-[#0a0a0a] flex flex-col py-4 px-2 sm:px-3 gap-1"> ... </div>
#           <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-8 scrollbar-thin"> ... </div>
#         </section>
#       </div>

# We will regex out these sections and re-arrange them.

body_start = content.find("      <MasteryChecklist")
commit_modal = content.find("      {showCommitModal && (")

if body_start == -1 or commit_modal == -1:
    print("Could not find sections!")
    exit(1)

pre_body = content[:body_start]
post_body = content[commit_modal:]
body_content = content[body_start:commit_modal]

# Extract MasteryChecklist
mastery_match = re.search(r"(      <MasteryChecklist.*?\n      />\n)", body_content, re.DOTALL)
mastery_code = mastery_match.group(1)

# Extract Screenshots section (LEFT: Screenshots)
screenshots_match = re.search(r"(        \{/\* ════ LEFT: Screenshots ════ \*/\}.*?        </section>\n)", body_content, re.DOTALL)
screenshots_code = screenshots_match.group(1)

# Extract Vertical Stepper (TABS)
stepper_match = re.search(r"(          \{/\* Vertical Stepper Sidebar \*/\}.*?          </div>\n)", body_content, re.DOTALL)
stepper_code = stepper_match.group(1)

# Extract Tab Content
tab_content_match = re.search(r"(          \{/\* Stepper Content \*/\}.*?          </div>\n)", body_content, re.DOTALL)
tab_content_code = tab_content_match.group(1)

# Now, we re-build the Body!
new_body = f"""      {{/* ── Body ── */}}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        
        {{/* ════ PANE 1: Navigation Sidebar (Left) ════ */}}
{stepper_code.replace("          {/* Vertical", "        {/* Vertical").replace('border-r border-[#131313] bg-[#0a0a0a]', 'border-r border-[#131313] bg-[#0a0a0a] overflow-y-auto z-10')}
        {{/* ════ PANE 2: Main Workspace (Center) ════ */}}
        <section className="flex-1 flex flex-col bg-[#060606] min-h-0 overflow-hidden relative">
{mastery_code}
{tab_content_code.replace("          {/* Stepper Content", "          {/* Stepper Content")}
        </section>

        {{/* ════ PANE 3: Assets & Screenshots (Right) ════ */}}
{screenshots_code.replace("════ LEFT: Screenshots ════", "════ RIGHT: Assets & Screenshots ════").replace("flex flex-col lg:w-[42%] xl:w-[38%] border-b lg:border-b-0 lg:border-r", "hidden xl:flex flex-col w-[320px] 2xl:w-[380px] shrink-0 border-l").replace('lg:max-h-none', 'xl:max-h-none')}
      </div>
\n"""

# Also fix the Header buttons (Commit, Radio)
header_match = re.search(r"(        <div className=\"flex items-center gap-2 sm:gap-3\">\n.*?        </div>\n      </header>)", pre_body, re.DOTALL)

new_header_buttons = """        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Actions */}
          <div className="flex bg-[#111] border border-[#2a2a2a] rounded-md overflow-hidden">
            <button
              onClick={() => setFocusRadioEnabled(!focusRadioEnabled)}
              className={`flex items-center justify-center w-10 h-8 transition-colors ${
                focusRadioEnabled
                  ? "bg-[#a855f7]/20 text-[#a855f7]"
                  : "text-[#eee] hover:text-[#a855f7] hover:bg-[#a855f7]/10"
              }`}
              title="Focus Radio (Lo-Fi Beats)"
            >
              <Headphones size={13} className={focusRadioEnabled ? "animate-pulse" : ""} />
            </button>
            <div className="w-px h-8 bg-[#2a2a2a]" />
            <button
              onClick={() => setShowCommitModal(true)}
              disabled={commitGitHubMutation.isPending}
              className="flex items-center justify-center w-10 h-8 transition-colors text-[#eee] hover:text-[#60a5fa] hover:bg-[#3b5bdb]/10 disabled:opacity-50"
              title="Commit to GitHub Workspace"
            >
              {commitGitHubMutation.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <GitBranch size={13} />
              )}
            </button>
          </div>
          {focusRadioEnabled && (
            <iframe
              width="0"
              height="0"
              src="https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=0"
              frameBorder="0"
              allow="autoplay"
              className="hidden"
            />
          )}
        </div>
      </header>"""

new_pre_body = pre_body[:header_match.start()] + new_header_buttons + pre_body[header_match.end():]

# We need to make sure the right pane (Screenshots) is accessible.
# The user wants "responsive and regular and consistent". If it's hidden on lg and below, they can't access screenshots.
# Let's change the right pane class so on smaller screens it stacks at the bottom.
new_body = new_body.replace("hidden xl:flex flex-col w-[320px] 2xl:w-[380px] shrink-0 border-l", "flex flex-col lg:w-[320px] xl:w-[340px] shrink-0 border-t lg:border-t-0 lg:border-l")

# Adjust margins and padding for Main Workspace Center to be responsive.
# Center main workspace should have padding.

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_pre_body + new_body + post_body)

print("Done!")
