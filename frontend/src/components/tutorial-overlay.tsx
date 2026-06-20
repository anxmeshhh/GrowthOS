import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';

export function useAppTutorial() {
  const startTutorial = () => {
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: false,
      overlayColor: 'rgba(0, 0, 0, 0.8)',
      steps: [
        {
          popover: {
            title: 'Welcome to GrowthOS! 🚀',
            description: 'Let\'s take a quick tour of your new Command Center. Click Next to continue.',
            side: 'bottom',
            align: 'start'
          }
        },
        {
          element: '#nav-dashboard',
          popover: {
            title: 'Command Center',
            description: 'This is your main dashboard. Here you can track your overall progress, daily streaks, and recent activity.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#nav-roadmap',
          popover: {
            title: 'Learning Roadmap',
            description: 'Here you can view and build learning paths. Custom paths let you set your own goals and timelines.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#nav-notes',
          popover: {
            title: 'Your Library',
            description: 'All your notes, screenshots, and documents are stored here. Everything is searchable and tagged by topic.',
            side: 'right',
            align: 'start'
          }
        },
        {
          element: '#nav-profile',
          popover: {
            title: 'Profile & Settings',
            description: 'View your achievements, customize your profile, and start this tutorial again anytime you want.',
            side: 'right',
            align: 'start'
          }
        },
        {
          popover: {
            title: 'You\'re all set! 🎉',
            description: 'Start exploring and building your skills. Happy learning!',
            side: 'bottom',
            align: 'center'
          }
        }
      ]
    });

    driverObj.drive();
    localStorage.setItem('hasSeenTutorial', 'true');
  };

  useEffect(() => {
    // Automatically start tutorial for new users
    if (typeof window !== 'undefined') {
      const hasSeen = localStorage.getItem('hasSeenTutorial');
      if (!hasSeen) {
        // Small delay to let the UI render
        setTimeout(startTutorial, 1000);
      }
    }
  }, []);

  return { startTutorial };
}
