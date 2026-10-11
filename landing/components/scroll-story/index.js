(() => {
  "use strict";

  const story = window.SplitSlateStory;

  const createScrollStory = () => {
    const element = document.createElement("div");
    element.className = "ss-sticky";
    element.innerHTML = `
      <div class="ss-scene-inner">
        <h1 class="sr-only">Less calculating. More living.</h1>
        <div class="ss-story-topline"><span>ONE NIGHT. THREE FRIENDS.</span>
          <a href="#inside-the-app" class="ss-skip-story">Skip the story <span aria-hidden="true">↘</span></a></div>
        <div class="ss-copy-stack">
          <div class="ss-copy ss-copy-opening">
            <p class="ss-eyebrow">THE NIGHT WAS THE EASY PART.</p>
            <h2>Great company.<br /><span>Complicated tabs.</span></h2>
            <p>Dinner, a ride home, and the question nobody wants to work out.</p>
          </div>
          <div class="ss-copy ss-copy-frustration">
            <p class="ss-eyebrow">SOUND FAMILIAR?</p>
            <h2>There has to be<br /><span>an easier way.</span></h2>
            <p>Good memories shouldn’t come with homework.</p>
          </div>
          <div class="ss-copy ss-copy-discovery">
            <p class="ss-eyebrow">MEET SPLIT SLATE.</p>
            <h2>Keep the night.<br /><span>Lose the math.</span></h2>
            <p>Who paid. Who joined. That’s your part.<br />We’ll take it from here.</p>
          </div>
          <div class="ss-copy ss-copy-resolution">
            <p class="ss-eyebrow">NO GUESSWORK. NO BACK-AND-FORTH.</p>
            <h2>Three friends.<br /><span>A clear picture.</span></h2>
            <p>$150 together. $50 each.<br />Two suggested repayments. All figured out.</p>
          </div>
          <div class="ss-copy ss-copy-final" inert aria-hidden="true">
            <p class="ss-eyebrow">A LITTLE LESS MENTAL MATH.</p>
            <h2>Less calculating.<br /><span>More living.</span></h2>
            <p>Split expenses effortlessly.<br />Know exactly who owes whom.</p>
            <a class="button button-primary ss-final-link" tabindex="-1" href="${story.data.appUrl}"
              target="_blank" rel="noopener noreferrer">Start your first group
              <svg class="icon" aria-hidden="true"><use href="#arrow"/></svg></a>
          </div>
        </div>
        <div class="ss-visual" aria-hidden="true">
          <div class="ss-stage"><div class="ss-phone-halo"></div></div>
        </div>
        <div class="ss-story-footer">
          <div class="ss-chapters" aria-hidden="true">
            <span class="ss-chapter-label is-current">01 <span>The mental math</span></span>
            <span class="ss-chapter-label">02 <span>The last straw</span></span>
            <span class="ss-chapter-label">03 <span>A clear slate</span></span>
            <span class="ss-chapter-label">04 <span>All figured out</span></span>
            <span class="ss-chapter-label">05 <span>More living</span></span>
          </div>
          <div class="ss-story-progress"><div class="ss-story-progress-fill"></div></div>
        </div>
      </div>`;
    const stage = element.querySelector(".ss-stage");
    stage.append(story.createWorkspace(), story.createPhone());
    return element;
  };

  story.createScrollStory = createScrollStory;
})();
