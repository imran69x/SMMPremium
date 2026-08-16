import re

css = """
:root {
  --light-color-primary: #F349A4;
  --light-color-primary-variant: #B1437E;
  --light-color-primary-variant-2: #671086;
  --light-color-secondary: #2ED9E7;
  --light-color-secondary-variant: #2C7BA1;
  --light-color-tertiary: #FFE629;
  --light-color-background: white;
  --light-color-surface: rgba(0, 0, 0, .04);
  --dark-color-primary: #FFE629;
  --dark-color-secondary: #F349A4;
  --dark-color-secondary-variant: #B1437E;
  --dark-color-tertiary: #2ED9E7;
  --dark-color-tertiary-variant: #2C7BA1;
  --dark-color-secondary-variant-2: #671086;
  --dark-color-surface: #071F49;
  --dark-color-background: #081226;
  --color-surface: #071F49;
  --color-background: #081226;
  --color-primary: #FFE629;
  --color-primary-variant: #575A0E;
  --color-secondary: #F349A4;
  --color-secondary-dark: #B1437E;
}

@layer properties {
  @property --blur {
    syntax: "<length>";
    inherits: true;
    initial-value: 0em;
  }
  @property --progress {
    syntax: "<number>";
    inherits: true;
    initial-value: 0;
  }
}
@-webkit-keyframes checked {
  from {
    --progress: 0;
  }
  to {
    --progress: 1;
  }
}
@keyframes checked {
  from {
    --progress: 0;
  }
  to {
    --progress: 1;
  }
}
@-webkit-keyframes unchecked {
  from {
    --progress: 1;
  }
  to {
    --progress: 0;
  }
}
@keyframes unchecked {
  from {
    --progress: 1;
  }
  to {
    --progress: 0;
  }
}
.star-wars-toggle input[type=checkbox] {
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  height: 1px;
  overflow: hidden;
  position: absolute;
  white-space: nowrap;
  width: 1px;
}

@-webkit-keyframes pulse {
  from {
    --blur: .9em;
  }
  50% {
    --blur: 1.3em;
  }
  to {
    --blur: .9em;
  }
}

@keyframes pulse {
  from {
    --blur: .9em;
  }
  50% {
    --blur: 1.3em;
  }
  to {
    --blur: .9em;
  }
}
.star-wars-toggle .lightsaber {
  position: absolute;
  display: flex;
  height: 1.2em;
  width: 28em;
  left: 2em;
}
.star-wars-toggle .lightsaber .light {
  width: 12em;
  border-top-left-radius: 2em;
  border-bottom-left-radius: 2em;
  background: var(--light-color-secondary);
  box-shadow: 0 0 1em var(--blur) rgba(255, 255, 255, 0.5), 0 0 6em var(--blur) var(--light-color-secondary);
  transition: opacity 0.6s linear, transform 0.6s linear;
  opacity: 0;
  -webkit-animation: pulse 1s ease-in-out infinite;
          animation: pulse 1s ease-in-out infinite;
  transform: scaleX(0);
  transform-origin: right;
}
.checked .star-wars-toggle .lightsaber .light {
  opacity: 1;
  transform: scaleX(1);
}
.star-wars-toggle .lightsaber .grip {
  width: 3.5em;
  background: #081F48;
  border-radius: 2em;
  transform: scaleX(1.2);
}
.star-wars-toggle .lightsaber .dark {
  width: 12em;
  border-top-right-radius: 2em;
  border-bottom-right-radius: 2em;
  background: var(--dark-color-secondary);
  box-shadow: 0 0 6em var(--blur) var(--dark-color-secondary);
  transition: opacity 0.6s linear, transform 0.6s linear;
  opacity: 1;
  -webkit-animation: pulse 1s ease-in-out infinite;
          animation: pulse 1s ease-in-out infinite;
  transform: scaleX(1);
  transform-origin: left;
}
.checked .star-wars-toggle .lightsaber .dark {
  opacity: 0;
  transform: scaleX(0);
}

.star-wars-toggle .side.light-side {
  --size: 16em;
  --angle: calc(180deg * var(--progress, 0));
  --radius: calc(var(--size) / 2);
  --y: calc(sin(var(--angle)) * var(--radius) * -1);
  --x: calc(cos(var(--angle)) * var(--radius) * -1);
  transform: translateZ(var(--x)) translateX(var(--y)) rotateY(calc(var(--angle)));
  transition: opacity 0.3s ease;
  opacity: 0;
}
.star-wars-toggle .side.light-side .circle {
  background: var(--light-color-secondary);
  width: 5.2em;
  aspect-ratio: 1;
  border-radius: 1.4em;
  position: absolute;
  top: 4em;
  left: 2.3em;
  z-index: 111;
}
.star-wars-toggle .side.light-side .sub-circle {
  background: black;
  aspect-ratio: 1;
  border-radius: 50%;
  position: absolute;
  inset: 0.5em;
  z-index: 111;
}
.star-wars-toggle .side.light-side .sub-circle:after {
  content: "";
  position: absolute;
  left: 1.8em;
  top: 0.9em;
  width: 1.4em;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--light-color-tertiary);
}
.star-wars-toggle .side.light-side .top {
  display: flex;
  gap: 1em;
  transform: translate(2.5em, 1em);
}
.star-wars-toggle .side.light-side .top .right {
  background: var(--light-color-secondary);
  height: 2em;
  width: 5em;
  -webkit-mask: radial-gradient(100% 100% at 0% 120%, black 100%, transparent);
          mask: radial-gradient(100% 100% at 0% 120%, black 100%, transparent);
}
.star-wars-toggle .side.light-side .top .left {
  background: var(--light-color-secondary);
  height: 2em;
  width: 2em;
  -webkit-mask: radial-gradient(100% 100% at 100% 120%, black 100%, transparent);
          mask: radial-gradient(100% 100% at 100% 120%, black 100%, transparent);
}
.star-wars-toggle .side.light-side .center {
  transform: translateY(7.5em);
  display: flex;
  flex-direction: row-reverse;
  height: 2em;
  gap: 0.8em;
}
.star-wars-toggle .side.light-side .center .item-1 {
  background: var(--light-color-secondary);
  width: 4em;
  -webkit-mask: radial-gradient(100% 200% at 0% 0%, black 90%, transparent 90%);
          mask: radial-gradient(100% 200% at 0% 0%, black 90%, transparent 90%);
}
.star-wars-toggle .side.light-side .center .item-2 {
  background: var(--light-color-primary-variant);
  width: 2em;
}
.star-wars-toggle .side.light-side .center .item-3 {
  background: var(--light-color-secondary);
  width: 3.2em;
  height: 1.5em;
  margin-top: 0.5em;
  position: relative;
}
.star-wars-toggle .side.light-side .center .item-3:after {
  content: "";
  position: absolute;
  border-radius: 50%;
  margin-top: 0.25em;
  right: 1.5em;
  width: 1em;
  aspect-ratio: 1;
  background: var(--light-color-primary);
}
.star-wars-toggle .side.light-side .center .item-4 {
  border-radius: 50%;
  width: 1.4em;
  height: 1.4em;
  background: var(--light-color-primary-variant-2);
  transform: translateY(0.4em);
}
.star-wars-toggle .side.light-side .center .item-5 {
  background: var(--light-color-secondary);
  width: 1em;
  transform: translateX(0.5em);
  -webkit-mask: radial-gradient(100% 130% at 110% 0%, black 90%, transparent 90%);
          mask: radial-gradient(100% 130% at 110% 0%, black 90%, transparent 90%);
}
.star-wars-toggle .side.light-side .bottom {
  transform: translateY(8.5em);
}
.star-wars-toggle .side.light-side .bottom .line {
  background: var(--light-color-secondary);
  height: 1.5em;
  -webkit-mask: radial-gradient(35% 80% at 48% 0%, black 100%, transparent);
          mask: radial-gradient(35% 80% at 48% 0%, black 100%, transparent);
}
.checked .star-wars-toggle .side.light-side {
  opacity: 1;
}

.star-wars-toggle .side.dark-side {
  --size: 15em;
  --angle: calc(180deg * (var(--progress, 0)));
  --radius: calc(var(--size) / 2);
  --y: calc(sin(var(--angle)) * var(--radius));
  --x: calc(cos(var(--angle)) * var(--radius));
  transform: translateZ(var(--x)) translateX(var(--y)) rotateY(calc(var(--angle)));
}
.star-wars-toggle .side.dark-side .circle {
  background: var(--dark-color-secondary);
  border: 0.6em solid var(--dark-color-secondary-variant-2);
  width: 4.9em;
  aspect-ratio: 1;
  border-radius: 50%;
  position: absolute;
  top: 1.7em;
  left: 2em;
  z-index: 111;
}
.star-wars-toggle .side.dark-side .sub-circle {
  background: var(--dark-color-tertiary);
  border: 0.2em solid var(--dark-color-tertiary-variant);
  width: 2.1em;
  aspect-ratio: 1;
  border-radius: 50%;
  position: absolute;
  top: 0em;
  left: 0em;
  z-index: 111;
}
.star-wars-toggle .side.dark-side .sub-circle:after {
  content: "";
  position: absolute;
  left: 1em;
  top: 1em;
  width: 0.6em;
  aspect-ratio: 1;
  border-radius: 50%;
  background: var(--dark-color-primary);
  border: 0.3em solid #183B79;
}

.star-wars-toggle.switch {
  display: flex;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  gap: 7em;
  --color-thumb: var(--color-primary-variant);
}
.unchecked .star-wars-toggle.switch {
  -webkit-animation: unchecked 0.45s ease-in-out forwards;
          animation: unchecked 0.45s ease-in-out forwards;
}
.checked .star-wars-toggle.switch {
  -webkit-animation: checked 0.45s ease-in-out forwards;
          animation: checked 0.45s ease-in-out forwards;
  --color-thumb: #671086;
}

.star-wars-toggle .track {
  width: 32em;
  height: 18em;
  background: var(--dark-color-surface);
  border-radius: 20em;
  position: relative;
  display: flex;
  align-items: center;
  padding: 1.5em;
  transition: all 0.35s ease;
  box-shadow: inset 0 0 6em rgba(0, 0, 0, 0.9);
}
.checked .star-wars-toggle .track {
  background: var(--light-color-surface);
  box-shadow: inset 0 0 3em rgba(0, 0, 0, 0.3);
}

.star-wars-toggle .thumb {
  height: 100%;
  aspect-ratio: 1;
  transform: translateX(calc(14em * var(--progress)));
  position: relative;
  transform-style: preserve-3d;
  border-radius: 50%;
}
.star-wars-toggle .thumb:after {
  content: "";
  position: absolute;
  inset: 0;
  -webkit-mask: linear-gradient(black, black) no-repeat, url("https://assets.codepen.io/907471/deathstar-mask.svg") no-repeat;
          mask: linear-gradient(black, black) no-repeat, url("https://assets.codepen.io/907471/deathstar-mask.svg") no-repeat;
  -webkit-mask-size: 150% 100%, 100% 100%;
          mask-size: 150% 100%, 100% 100%;
  -webkit-mask-position: calc(-15em + (15em * var(--progress, 0))) 0, calc(0em + (15em * var(--progress, 0))) 0;
          mask-position: calc(-15em + (15em * var(--progress, 0))) 0, calc(0em + (15em * var(--progress, 0))) 0;
  background: radial-gradient(88% 88% at 55% 50%, var(--color-secondary) 50%, #B1437E 50%, #B1437E 55%, #671086 55%, #671086 60%, transparent 60%) no-repeat, linear-gradient(var(--dark-color-surface), var(--dark-color-surface)) no-repeat, radial-gradient(90% 90% at 55% 50%, var(--color-primary) 50%, var(--color-primary-variant) 50%, transparent 70%) no-repeat, var(--color-thumb);
  background-position: calc(-16em + (16.5em * var(--progress, 0))) 0, calc(0px + (16em * var(--progress, 0))) 50%, calc(0px + (16em * var(--progress, 0))) 0;
  border-radius: 50%;
  background-size: 100% 100%, 100% 1em, 100% 100%;
}

"""

with open("c:\\follow\\src\\components\\StarWarsToggle.css", "w") as f:
    f.write(css.replace('vmin', 'em'))

print("done")
