"use client";

import "./process-01.css";
import "./features-01.css";
import Image from "next/image";
import { useState, type KeyboardEvent, type ReactNode } from "react";

const A = "/originkit/features-01";

type Feature = {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  image: string;
};

const FEATURES: Feature[] = [
  {
    id: "meetings",
    title: "Plan together",
    description: "Invite friends, comment and propose changes",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <g clipPath="url(#clip0_3038_18146)">
          <path
            opacity="0.2"
            d="M21 12.0005C21.0013 13.2626 20.7365 14.5109 20.2228 15.6638C19.7091 16.8167 18.9581 17.8484 18.0188 18.6914C17.454 17.5805 16.5927 16.6477 15.5304 15.9963C14.4681 15.3448 13.2462 15.0001 12 15.0005C12.7417 15.0005 13.4667 14.7805 14.0834 14.3685C14.7001 13.9564 15.1807 13.3707 15.4646 12.6855C15.7484 12.0003 15.8226 11.2463 15.6779 10.5189C15.5333 9.79143 15.1761 9.12325 14.6517 8.5988C14.1272 8.07435 13.459 7.7172 12.7316 7.57251C12.0042 7.42781 11.2502 7.50207 10.5649 7.7859C9.87972 8.06973 9.29405 8.55038 8.88199 9.16706C8.46994 9.78375 8.25 10.5088 8.25 11.2505C8.25 12.245 8.64509 13.1988 9.34835 13.9021C10.0516 14.6054 11.0054 15.0005 12 15.0005C10.7538 15.0001 9.5319 15.3448 8.46958 15.9963C7.40725 16.6477 6.54601 17.5805 5.98125 18.6914C4.86586 17.6881 4.01896 16.422 3.51756 15.008C3.01615 13.5941 2.87615 12.0772 3.11028 10.5954C3.34442 9.11357 3.94526 7.71377 4.85817 6.5233C5.77108 5.33283 6.9671 4.38945 8.33747 3.77894C9.70784 3.16843 11.2091 2.91017 12.7047 3.02763C14.2003 3.1451 15.6428 3.63456 16.9011 4.45152C18.1593 5.26848 19.1934 6.38702 19.9093 7.70541C20.6251 9.02381 21.0001 10.5002 21 12.0005Z"
            fill="#1E1E1E"
          />
          <path
            d="M23.781 12.53L21.531 14.78C21.4614 14.8497 21.3787 14.9051 21.2876 14.9428C21.1966 14.9806 21.099 15 21.0004 15C20.9019 15 20.8043 14.9806 20.7132 14.9428C20.6222 14.9051 20.5394 14.8497 20.4698 14.78L18.2198 12.53C18.0791 12.3893 18 12.1984 18 11.9994C18 11.8004 18.0791 11.6095 18.2198 11.4688C18.3605 11.328 18.5514 11.249 18.7504 11.249C18.9494 11.249 19.1403 11.328 19.281 11.4688L20.2504 12.4391V11.9994C20.2513 10.2525 19.6976 8.55039 18.6691 7.13831C17.6407 5.72623 16.1905 4.67706 14.5276 4.14193C12.8647 3.60681 11.0748 3.61335 9.41586 4.16062C7.75689 4.70789 6.31446 5.76764 5.29635 7.1872C5.18024 7.34882 5.00468 7.45769 4.80829 7.48986C4.61191 7.52204 4.41078 7.47488 4.24917 7.35877C4.08755 7.24265 3.97868 7.06709 3.94651 6.8707C3.91433 6.67432 3.96149 6.47319 4.0776 6.31158C5.28087 4.63394 6.98562 3.38156 8.94625 2.73484C10.9069 2.08813 13.0222 2.08047 14.9875 2.71297C16.9527 3.34547 18.6665 4.58548 19.8819 6.25436C21.0973 7.92325 21.7515 9.93485 21.7504 11.9994V12.4391L22.7198 11.4688C22.8605 11.328 23.0514 11.249 23.2504 11.249C23.4494 11.249 23.6403 11.328 23.781 11.4688C23.9218 11.6095 24.0008 11.8004 24.0008 11.9994C24.0008 12.1984 23.9218 12.3893 23.781 12.53ZM19.9204 17.6863C18.7168 19.3626 17.0123 20.6139 15.0523 21.2598C13.0923 21.9058 10.9779 21.9132 9.01338 21.281C7.04891 20.6487 5.3357 19.4094 4.12039 17.7415C2.90507 16.0736 2.25033 14.0631 2.25042 11.9994V11.5597L1.28104 12.53C1.14031 12.6707 0.94944 12.7498 0.750417 12.7498C0.551394 12.7498 0.360523 12.6707 0.219792 12.53C0.0790616 12.3893 0 12.1984 0 11.9994C0 11.8004 0.0790616 11.6095 0.219792 11.4688L2.46979 9.21877C2.53945 9.14903 2.62216 9.09371 2.71321 9.05597C2.80426 9.01823 2.90186 8.9988 3.00042 8.9988C3.09898 8.9988 3.19657 9.01823 3.28762 9.05597C3.37867 9.09371 3.46139 9.14903 3.53104 9.21877L5.78104 11.4688C5.92177 11.6095 6.00083 11.8004 6.00083 11.9994C6.00083 12.1984 5.92177 12.3893 5.78104 12.53C5.64031 12.6707 5.44944 12.7498 5.25042 12.7498C5.05139 12.7498 4.86052 12.6707 4.71979 12.53L3.75042 11.5597V11.9994C3.74864 14.0189 4.4909 15.9684 5.83542 17.4753C6.67188 16.2632 7.84806 15.3255 9.21604 14.78C8.48122 14.2012 7.94501 13.4079 7.68198 12.5102C7.41896 11.6126 7.4422 10.6553 7.74847 9.77146C8.05473 8.88764 8.62881 8.12122 9.39085 7.57879C10.1529 7.03635 11.065 6.74487 12.0004 6.74487C12.9358 6.74487 13.8479 7.03635 14.61 7.57879C15.372 8.12122 15.9461 8.88764 16.2524 9.77146C16.5586 10.6553 16.5819 11.6126 16.3188 12.5102C16.0558 13.4079 15.5196 14.2012 14.7848 14.78C16.154 15.3256 17.331 16.2644 18.1673 17.4781C18.3569 17.2652 18.5356 17.0427 18.7026 16.8116C18.8187 16.65 18.9943 16.5411 19.1907 16.5089C19.3871 16.4767 19.5882 16.5239 19.7498 16.64C19.9114 16.7561 20.0203 16.9317 20.0525 17.1281C20.0846 17.3245 20.0375 17.5256 19.9214 17.6872L19.9204 17.6863ZM12.0004 14.2494C12.5938 14.2494 13.1738 14.0734 13.6671 13.7438C14.1605 13.4142 14.545 12.9456 14.7721 12.3974C14.9991 11.8493 15.0585 11.2461 14.9428 10.6641C14.827 10.0822 14.5413 9.54763 14.1217 9.12807C13.7022 8.70851 13.1676 8.42279 12.5857 8.30703C12.0037 8.19128 11.4005 8.25069 10.8524 8.47775C10.3042 8.70481 9.83565 9.08933 9.50601 9.58268C9.17636 10.076 9.00042 10.656 9.00042 11.2494C9.00042 12.045 9.31649 12.8081 9.8791 13.3707C10.4417 13.9333 11.2048 14.2494 12.0004 14.2494ZM12.0004 20.2494C13.8308 20.247 15.6087 19.6373 17.0554 18.516C16.5129 17.6674 15.7654 16.9691 14.882 16.4854C13.9986 16.0017 13.0076 15.7481 12.0004 15.7481C10.9932 15.7481 10.0023 16.0017 9.11884 16.4854C8.23542 16.9691 7.48798 17.6674 6.94542 18.516C8.38994 19.6414 10.1693 20.2515 12.0004 20.2494Z"
            fill="#1E1E1E"
          />
        </g>
        <defs>
          <clipPath id="clip0_3038_18146">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
    image: `${A}/meeting.png`,
  },
  {
    id: "planning",
    title: "Day-by-day itinerary",
    description: "Drag places between days, even before dates are set",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          opacity="0.2"
          d="M20.25 4.5V8.25H3.75V4.5C3.75 4.30109 3.82902 4.11032 3.96967 3.96967C4.11032 3.82902 4.30109 3.75 4.5 3.75H19.5C19.6989 3.75 19.8897 3.82902 20.0303 3.96967C20.171 4.11032 20.25 4.30109 20.25 4.5Z"
          fill="#1E1E1E"
        />
        <path
          d="M19.5 3H17.25V2.25C17.25 2.05109 17.171 1.86032 17.0303 1.71967C16.8897 1.57902 16.6989 1.5 16.5 1.5C16.3011 1.5 16.1103 1.57902 15.9697 1.71967C15.829 1.86032 15.75 2.05109 15.75 2.25V3H8.25V2.25C8.25 2.05109 8.17098 1.86032 8.03033 1.71967C7.88968 1.57902 7.69891 1.5 7.5 1.5C7.30109 1.5 7.11032 1.57902 6.96967 1.71967C6.82902 1.86032 6.75 2.05109 6.75 2.25V3H4.5C4.10218 3 3.72064 3.15804 3.43934 3.43934C3.15804 3.72064 3 4.10218 3 4.5V19.5C3 19.8978 3.15804 20.2794 3.43934 20.5607C3.72064 20.842 4.10218 21 4.5 21H19.5C19.8978 21 20.2794 20.842 20.5607 20.5607C20.842 20.2794 21 19.8978 21 19.5V4.5C21 4.10218 20.842 3.72064 20.5607 3.43934C20.2794 3.15804 19.8978 3 19.5 3ZM6.75 4.5V5.25C6.75 5.44891 6.82902 5.63968 6.96967 5.78033C7.11032 5.92098 7.30109 6 7.5 6C7.69891 6 7.88968 5.92098 8.03033 5.78033C8.17098 5.63968 8.25 5.44891 8.25 5.25V4.5H15.75V5.25C15.75 5.44891 15.829 5.63968 15.9697 5.78033C16.1103 5.92098 16.3011 6 16.5 6C16.6989 6 16.8897 5.92098 17.0303 5.78033C17.171 5.63968 17.25 5.44891 17.25 5.25V4.5H19.5V7.5H4.5V4.5H6.75ZM19.5 19.5H4.5V9H19.5V19.5ZM15 14.25C15 14.4489 14.921 14.6397 14.7803 14.7803C14.6397 14.921 14.4489 15 14.25 15H12.75V16.5C12.75 16.6989 12.671 16.8897 12.5303 17.0303C12.3897 17.171 12.1989 17.25 12 17.25C11.8011 17.25 11.6103 17.171 11.4697 17.0303C11.329 16.8897 11.25 16.6989 11.25 16.5V15H9.75C9.55109 15 9.36032 14.921 9.21967 14.7803C9.07902 14.6397 9 14.4489 9 14.25C9 14.0511 9.07902 13.8603 9.21967 13.7197C9.36032 13.579 9.55109 13.5 9.75 13.5H11.25V12C11.25 11.8011 11.329 11.6103 11.4697 11.4697C11.6103 11.329 11.8011 11.25 12 11.25C12.1989 11.25 12.3897 11.329 12.5303 11.4697C12.671 11.6103 12.75 11.8011 12.75 12V13.5H14.25C14.4489 13.5 14.6397 13.579 14.7803 13.7197C14.921 13.8603 15 14.0511 15 14.25Z"
          fill="#1E1E1E"
        />
      </svg>
    ),
    image: `${A}/planning.png`,
  },
  {
    id: "events",
    title: "Tours and vouchers",
    description: "Pickup times, stops and vouchers, available offline",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <g clipPath="url(#clip0_3038_18164)">
          <g filter="url(#filter0_dd_3038_18164)">
            <path
              opacity="0.2"
              d="M19.5 8.25V10.5H6.54094C6.38352 10.5 6.23009 10.5495 6.10238 10.6415C5.97467 10.7336 5.87916 10.8635 5.82938 11.0128L3 19.5V6C3 5.80109 3.07902 5.61032 3.21967 5.46967C3.36032 5.32902 3.55109 5.25 3.75 5.25H8.74969C8.91197 5.25 9.06987 5.30263 9.19969 5.4L12 7.5H18.75C18.9489 7.5 19.1397 7.57902 19.2803 7.71967C19.421 7.86032 19.5 8.05109 19.5 8.25Z"
              fill="#F7F7F7"
            />
            <path
              d="M22.9688 10.3725C22.8295 10.1795 22.6464 10.0224 22.4345 9.91416C22.2226 9.80592 21.988 9.74965 21.75 9.75H20.25V8.25C20.25 7.85218 20.092 7.47064 19.8107 7.18934C19.5294 6.90804 19.1478 6.75 18.75 6.75H12.2503L9.65063 4.8C9.39054 4.60611 9.07503 4.50094 8.75062 4.5H3.75C3.35218 4.5 2.97064 4.65804 2.68934 4.93934C2.40804 5.22064 2.25 5.60218 2.25 6V19.5C2.25 19.6989 2.32902 19.8897 2.46967 20.0303C2.61032 20.171 2.80109 20.25 3 20.25H19.7906C19.948 20.25 20.1015 20.2005 20.2292 20.1085C20.3569 20.0164 20.4524 19.8865 20.5022 19.7372L23.1731 11.7244C23.2482 11.4989 23.2689 11.2589 23.2334 11.0239C23.1978 10.7889 23.1072 10.5657 22.9688 10.3725ZM8.75062 6L11.55 8.1C11.6798 8.19737 11.8377 8.25 12 8.25H18.75V9.75H6.54094C6.2261 9.74998 5.91924 9.84902 5.66382 10.0331C5.4084 10.2172 5.21738 10.4769 5.11781 10.7756L3.75 14.8781V6H8.75062ZM19.2506 18.75H4.04062L6.54094 11.25H21.75L19.2506 18.75Z"
              fill="#1E1E1E"
            />
          </g>
        </g>
        <defs>
          <filter
            id="filter0_dd_3038_18164"
            x="-2.9881"
            y="4.5"
            width="31.4767"
            height="26.2262"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="5.2381" />
            <feGaussianBlur stdDeviation="2.61905" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_3038_18164"
            />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="1.04762" />
            <feGaussianBlur stdDeviation="0.52381" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"
            />
            <feBlend
              mode="normal"
              in2="effect1_dropShadow_3038_18164"
              result="effect2_dropShadow_3038_18164"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect2_dropShadow_3038_18164"
              result="shape"
            />
          </filter>
          <clipPath id="clip0_3038_18164">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
    image: `${A}/event.png`,
  },
  {
    id: "integrations",
    title: "References from socials",
    description: "Save Instagram, Threads and TikTok finds into your plan",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <g clipPath="url(#clip0_3038_18173)">
          <g filter="url(#filter0_dd_3038_18173)">
            <path
              d="M10.1538 19.5922C10.1538 20.6397 10.9822 21.4922 12 21.4922C13.0178 21.4922 13.8462 20.6397 13.8462 19.5922C13.845 19.2005 13.7261 18.8188 13.5057 18.4995C13.2854 18.1801 12.9743 17.9388 12.6154 17.8087V15.7922H11.3846V17.8087C11.0257 17.9388 10.7146 18.1801 10.4943 18.4995C10.2739 18.8188 10.155 19.2005 10.1538 19.5922ZM12 18.9589C12.1632 18.9589 12.3197 19.0256 12.4351 19.1444C12.5506 19.2631 12.6154 19.4242 12.6154 19.5922C12.6154 19.7602 12.5506 19.9212 12.4351 20.04C12.3197 20.1588 12.1632 20.2255 12 20.2255C11.8368 20.2255 11.6803 20.1588 11.5649 20.04C11.4495 19.9212 11.3846 19.7602 11.3846 19.5922C11.3846 19.4242 11.4495 19.2631 11.5649 19.1444C11.6803 19.0256 11.8368 18.9589 12 18.9589ZM11.3846 6.17565V8.19219H12.6154V6.17565C12.9743 6.04553 13.2854 5.80424 13.5057 5.48491C13.7261 5.16557 13.845 4.78386 13.8462 4.39219C13.8462 3.34465 13.0178 2.49219 12 2.49219C10.9822 2.49219 10.1538 3.34465 10.1538 4.39219C10.1538 5.21679 10.6702 5.91345 11.3846 6.17565ZM11.3846 4.39219C11.3846 4.22422 11.4495 4.06313 11.5649 3.94435C11.6803 3.82558 11.8368 3.75885 12 3.75885C12.1632 3.75885 12.3197 3.82558 12.4351 3.94435C12.5506 4.06313 12.6154 4.22422 12.6154 4.39219C12.6154 4.56016 12.5506 4.72125 12.4351 4.84002C12.3197 4.95879 12.1632 5.02552 12 5.02552C11.8368 5.02552 11.6803 4.95879 11.5649 4.84002C11.4495 4.72125 11.3846 4.56016 11.3846 4.39219ZM18.1538 13.8922C17.7267 13.894 17.3137 14.0497 16.9865 14.3324L15.3698 13.3342L14.7545 14.4318L16.3446 15.4135C16.2904 15.6894 16.2964 15.9743 16.3622 16.2476C16.428 16.5209 16.5519 16.7757 16.725 16.9937C16.8981 17.2117 17.116 17.3875 17.3631 17.5082C17.6102 17.629 17.8803 17.6919 18.1538 17.6922C19.1717 17.6922 20 16.8397 20 15.7922C20 14.7447 19.1717 13.8922 18.1538 13.8922ZM18.1538 16.4255C17.9906 16.4255 17.8341 16.3588 17.7187 16.24C17.6033 16.1212 17.5385 15.9602 17.5385 15.7922C17.5385 15.6242 17.6033 15.4631 17.7187 15.3444C17.8341 15.2256 17.9906 15.1589 18.1538 15.1589C18.3171 15.1589 18.4736 15.2256 18.589 15.3444C18.7044 15.4631 18.7692 15.6242 18.7692 15.7922C18.7692 15.9602 18.7044 16.1212 18.589 16.24C18.4736 16.3588 18.3171 16.4255 18.1538 16.4255ZM18.1538 6.29219C17.8803 6.29251 17.6102 6.35534 17.3631 6.47613C17.116 6.59692 16.8981 6.77266 16.725 6.99067C16.5519 7.20868 16.428 7.46352 16.3622 7.73679C16.2964 8.01007 16.2904 8.29497 16.3446 8.57092L14.784 9.53422L15.3994 10.6318L16.9865 9.65202C17.3137 9.93463 17.7267 10.0904 18.1538 10.0922C19.1717 10.0922 20 9.23972 20 8.19219C20 7.14465 19.1717 6.29219 18.1538 6.29219ZM18.1538 8.82552C17.9906 8.82552 17.8341 8.75879 17.7187 8.64002C17.6033 8.52125 17.5385 8.36016 17.5385 8.19219C17.5385 8.02422 17.6033 7.86313 17.7187 7.74435C17.8341 7.62558 17.9906 7.55885 18.1538 7.55885C18.3171 7.55885 18.4736 7.62558 18.589 7.74435C18.7044 7.86313 18.7692 8.02422 18.7692 8.19219C18.7692 8.36016 18.7044 8.52125 18.589 8.64002C18.4736 8.75879 18.3171 8.82552 18.1538 8.82552ZM9.216 9.53485L7.65538 8.57092C7.68 8.44848 7.69231 8.32223 7.69231 8.19219C7.69231 7.14465 6.864 6.29219 5.84615 6.29219C4.82831 6.29219 4 7.14465 4 8.19219C4 9.23972 4.82831 10.0922 5.84615 10.0922C6.2733 10.0904 6.68634 9.93463 7.01354 9.65202L8.60123 10.6318L9.216 9.53485ZM5.84615 8.82552C5.68294 8.82552 5.52642 8.75879 5.41101 8.64002C5.2956 8.52125 5.23077 8.36016 5.23077 8.19219C5.23077 8.02422 5.2956 7.86313 5.41101 7.74435C5.52642 7.62558 5.68294 7.55885 5.84615 7.55885C6.00936 7.55885 6.16589 7.62558 6.2813 7.74435C6.3967 7.86313 6.46154 8.02422 6.46154 8.19219C6.46154 8.36016 6.3967 8.52125 6.2813 8.64002C6.16589 8.75879 6.00936 8.82552 5.84615 8.82552ZM9.20862 14.4546L8.59323 13.357L7.01354 14.3324C6.68634 14.0497 6.2733 13.894 5.84615 13.8922C4.82831 13.8922 4 14.7447 4 15.7922C4 16.8397 4.82831 17.6922 5.84615 17.6922C6.11965 17.6918 6.38966 17.629 6.6367 17.5083C6.88375 17.3875 7.10168 17.2118 7.27476 16.9939C7.44784 16.776 7.57176 16.5212 7.63758 16.248C7.7034 15.9748 7.70948 15.69 7.65538 15.4141L9.20862 14.4546ZM5.84615 16.4255C5.68294 16.4255 5.52642 16.3588 5.41101 16.24C5.2956 16.1212 5.23077 15.9602 5.23077 15.7922C5.23077 15.6242 5.2956 15.4631 5.41101 15.3444C5.52642 15.2256 5.68294 15.1589 5.84615 15.1589C6.00936 15.1589 6.16589 15.2256 6.2813 15.3444C6.3967 15.4631 6.46154 15.6242 6.46154 15.7922C6.46154 15.9602 6.3967 16.1212 6.2813 16.24C6.16589 16.3588 6.00936 16.4255 5.84615 16.4255ZM12 14.5255C10.6425 14.5255 9.53846 13.3893 9.53846 11.9922C9.53846 10.5951 10.6425 9.45885 12 9.45885C13.3575 9.45885 14.4615 10.5951 14.4615 11.9922C14.4615 13.3893 13.3575 14.5255 12 14.5255ZM12 10.7255C11.3218 10.7255 10.7692 11.2936 10.7692 11.9922C10.7692 12.6908 11.3218 13.2589 12 13.2589C12.6782 13.2589 13.2308 12.6908 13.2308 11.9922C13.2308 11.2936 12.6788 10.7255 12 10.7255Z"
              fill="#1E1E1E"
            />
          </g>
        </g>
        <defs>
          <filter
            id="filter0_dd_3038_18173"
            x="-1.2381"
            y="2.49219"
            width="26.4762"
            height="29.4762"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="5.2381" />
            <feGaussianBlur stdDeviation="2.61905" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"
            />
            <feBlend
              mode="normal"
              in2="BackgroundImageFix"
              result="effect1_dropShadow_3038_18173"
            />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feOffset dy="1.04762" />
            <feGaussianBlur stdDeviation="0.52381" />
            <feComposite in2="hardAlpha" operator="out" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"
            />
            <feBlend
              mode="normal"
              in2="effect1_dropShadow_3038_18173"
              result="effect2_dropShadow_3038_18173"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect2_dropShadow_3038_18173"
              result="shape"
            />
          </filter>
          <clipPath id="clip0_3038_18173">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    ),
    image: `${A}/powerful-integration.png`,
  },
];

const CARD_SHADOW =
  "shadow-[0_4px_4px_rgba(121,85,13,0.05),0_1px_1px_rgba(125,125,125,0.15),0_55px_33px_rgba(166,166,166,0.05),0_24px_24px_rgba(166,166,166,0.09),0_6px_13px_rgba(166,166,166,0.1)]";

const ACTIVE_TAB_SHADOW =
  "shadow-[0_5px_7px_rgba(4,139,240,0.05),0_5px_5px_rgba(22,26,29,0.05),0_1px_1px_rgba(22,26,29,0.15)]";

const FeatureTabVisual = ({
  feature,
  variant,
}: {
  feature: Feature;
  variant: "idle" | "active";
}) => {
  const isActive = variant === "active";

  return (
    <>
      <span
        className={`flex size-10 shrink-0 items-center justify-center overflow-clip rounded-lg border border-solid p-2 ${
          isActive
            ? "border-[#90d7f3] bg-white"
            : "border-[#e5e5e5] bg-linear-to-r from-white to-[#f2f2f2]"
        }`}
      >
        <span className="relative flex size-6 items-center justify-center overflow-clip [&_svg]:max-h-full [&_svg]:max-w-full">
          {feature.icon}
        </span>
      </span>

      <span className="flex min-w-0 flex-col gap-1.25">
        <span className="text-[16px] font-medium leading-[1.1] tracking-[-0.01em] text-[#1e1e1e] iphone:text-base">
          {feature.title}
        </span>
        <span
          className={`text-[13px] font-medium leading-[1.1] tracking-[-0.01em] iphone:text-[13px] ${
            isActive
              ? "text-[#4c6a75]"
              : feature.id === "meetings"
                ? "text-[#4c6a75]"
                : "text-[#60605d]"
          }`}
        >
          {feature.description}
        </span>
      </span>
    </>
  );
};

const FeatureTabs = ({
  activeId,
  onSelect,
  onKeyDown,
}: {
  activeId: string;
  onSelect: (id: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
}) => {
  return (
    <div
      role="tablist"
      aria-label="Kazkir features"
      aria-orientation="vertical"
      onKeyDown={onKeyDown}
      className="relative flex w-full shrink-0 flex-col gap-2.5 py-1 pl-0 ipad-landscape:w-90.25 ipad-landscape:gap-3 ipad-landscape:py-1 ipad-landscape:pl-1"
    >
      {FEATURES.map((feature) => {
        const isActive = activeId === feature.id;
        const hoverClass = isActive
          ? ""
          : "[@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#f7f9fb]";

        return (
          <button
            key={feature.id}
            type="button"
            role="tab"
            id={`feature-tab-${feature.id}`}
            aria-selected={isActive}
            aria-controls="feature-preview"
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(feature.id)}
            className={`relative z-0 flex w-full min-h-11 min-w-0 cursor-pointer items-center gap-3 overflow-clip rounded-xl border border-solid p-3 text-left touch-manipulation transition-[background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e1e1e] motion-reduce:transition-none ${hoverClass} ${
              isActive
                ? `border-[#9bd3e9] bg-[#bce7f8] ${ACTIVE_TAB_SHADOW}`
                : "border-transparent bg-white"
            }`}
          >
            <FeatureTabVisual
              feature={feature}
              variant={isActive ? "active" : "idle"}
            />
          </button>
        );
      })}
    </div>
  );
};

const WIDGET_IMAGE_WIDTH = 2020;
const WIDGET_IMAGE_HEIGHT = 965;

const FeaturePreview = ({ activeId }: { activeId: string }) => {
  const activeFeature =
    FEATURES.find((feature) => feature.id === activeId) ?? FEATURES[0];

  return (
    <div
      id="feature-preview"
      role="tabpanel"
      aria-labelledby={`feature-tab-${activeId}`}
      className="relative aspect-[1018/570] w-full min-w-0 flex-1 overflow-clip rounded-[17px] border border-solid border-[#dfe1e2] ipad-landscape:aspect-auto ipad-landscape:min-h-0"
      style={{
        backgroundImage:
          "linear-gradient(135deg, #fffcf5 0%, #fdfdfd 32%, #f7fcff 68%, #f0f8ff 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle, #c8cedd 1px, transparent 1px)",
          backgroundSize: "11px 11px",
        }}
      />

      <div className="absolute inset-0 z-10 flex items-center justify-center p-3 iphone:p-4 ipad-landscape:p-5">
        <div
          key={activeFeature.id}
          className="flex h-full w-full items-center justify-center animate-hero-reveal motion-reduce:animate-none [animation-duration:500ms] [animation-timing-function:cubic-bezier(0.23,1,0.32,1)]"
        >
          <Image
            alt={activeFeature.title}
            src={activeFeature.image}
            width={WIDGET_IMAGE_WIDTH}
            height={WIDGET_IMAGE_HEIGHT}
            className="m-0 block h-auto max-h-full w-full object-contain"
            sizes="(max-width: 1023px) 92vw, 640px"
            priority
          />
        </div>
      </div>
    </div>
  );
};

const Section7 = () => {
  const [activeId, setActiveId] = useState("planning");

  const handleSelectFeature = (nextId: string) => {
    if (nextId === activeId) return;
    setActiveId(nextId);
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = FEATURES.findIndex(
      (feature) => feature.id === activeId,
    );
    if (currentIndex < 0) return;

    let nextIndex = currentIndex;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % FEATURES.length;
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + FEATURES.length) % FEATURES.length;
    } else if (event.key === "Home") {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      nextIndex = FEATURES.length - 1;
    } else {
      return;
    }

    const nextId = FEATURES[nextIndex].id;
    handleSelectFeature(nextId);
    document.getElementById(`feature-tab-${nextId}`)?.focus();
  };

  return (
    <main className="min-h-screen bg-white text-[#010110] flex items-center justify-center">
      <section
        aria-labelledby="potential-heading"
        className="relative mx-auto my-[8px] flex w-full max-w-[97dvw] flex-col items-center overflow-clip rounded-3xl px-4 py-16 sm:px-6 sm:py-20 ipad:px-10 ipad:py-24 laptop:px-[clamp(2rem,10vw,13.8rem)] laptop:py-25"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <Image
            alt=""
            src={`${A}/bg.png`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 mix-blend-color-burn opacity-10">
            <Image
              alt=""
              src={`${A}/bg.png`}
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
        </div>

        <div className="relative z-10 flex w-full flex-col items-center gap-10 ipad:gap-15">
          <header className="flex w-full max-w-180 flex-col items-center gap-3 text-center">
            <h1
              id="potential-heading"
              className="animate-section-rise text-wrap text-[clamp(2rem,4vw,2.5rem)] font-medium leading-[1.12] tracking-[-0.04em] text-[#010110] motion-reduce:animate-none [animation-delay:0ms]"
            >
              Every trip, planned together
            </h1>
            <p className="animate-section-rise max-w-155 text-pretty text-[16px] font-medium leading-normal tracking-[-0.02em] text-[#45545e] iphone:text-base motion-reduce:animate-none [animation-delay:80ms]">
              Stop juggling WhatsApp chats, screenshots and spreadsheets. Kazkir
              <br className="hidden ipad:block" /> brings your itinerary, tours,
              references and Rupiah budget into one place.
            </p>
          </header>

          <div
            className={`animate-section-rise flex w-full max-w-237.5 flex-col gap-5 overflow-clip rounded-3xl bg-white p-3 motion-reduce:animate-none [animation-delay:160ms] ${CARD_SHADOW} ipad-landscape:flex-row ipad-landscape:items-stretch ipad-landscape:gap-5`}
          >
            <FeatureTabs
              activeId={activeId}
              onSelect={handleSelectFeature}
              onKeyDown={handleTabKeyDown}
            />

            <FeaturePreview activeId={activeId} />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Section7;