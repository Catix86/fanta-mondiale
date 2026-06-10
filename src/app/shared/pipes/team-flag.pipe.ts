import { Pipe, PipeTransform } from '@angular/core';
import { getTeamFlagPath } from '../../core/constants/team-flags';

@Pipe({
    name: 'teamFlag',
    standalone: true
})
export class TeamFlagPipe implements PipeTransform {
    transform(teamName: string | undefined | null): string {
        return getTeamFlagPath(teamName);
    }
}