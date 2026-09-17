import { Routes } from '@angular/router';
import { CharacterCreationComponent } from './pages/character-creation/character-creation.component';
import { PlayerDashboardComponent } from './pages/player-dashboard/player-dashboard.component';
import { DmBalancePanelComponent } from './pages/dm-dashboard/dm-balance-panel/dm-balance-panel.component';
import { TransmuteForgeComponent } from './pages/transmute-forge/transmute-forge.component';
import { LeaderboardComponent } from './pages/leaderboard/leaderboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'create-character', component: CharacterCreationComponent },
  { path: 'dashboard', component: PlayerDashboardComponent },
  { path: 'dm-balance', component: DmBalancePanelComponent },
  { path: 'transmute', component: TransmuteForgeComponent },
  { path: 'leaderboard', component: LeaderboardComponent },
  { path: '**', redirectTo: 'dashboard' },
];
