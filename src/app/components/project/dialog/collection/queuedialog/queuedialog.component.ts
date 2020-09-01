import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { startWith, switchMap, concatMap, map } from 'rxjs/operators';
import { interval, timer, from } from 'rxjs';
import { SubSink } from 'subsink';

import { ProjectService } from 'src/app/services/project/project';
import { UploadService } from 'src/app/services/project/upload';

@Component({
  selector: 'app-queuedialog',
  templateUrl: './queuedialog.component.html',
  styleUrls: ['./queuedialog.component.scss'],
})
export class QueuedialogComponent implements OnInit, OnDestroy {
  @Input() jobType: any;
  @Input() projectId: string;
  private subs = new SubSink();

  jobUuid: string;
  time = 0;
  position: number;
  fileUrl: string;

  progress = 0;
  maxTime = 0;
  constructor(
    private modalController: ModalController,
    public uploadService: UploadService,
    private projectService: ProjectService,
  ) { }

  ngOnInit() {
    this.jobUuid = this.uploadService.queue.job.job_uuid;
    this.time = this.uploadService.queue.estimate_time;
    this.position = this.uploadService.queue.position;
    this.startPoll();
  }

  startPoll() {
    this.subs.sink = timer(0, 1000).pipe(
      concatMap(() => this.uploadService.getJobStatus(this.jobUuid))
    ).subscribe(res => {
      if (res.job.flag_status == 'Succeeded') {
        this.stopPoll();
        if (this.jobType == 'download') {
          this.download(res.job.job_json.download);
          this.modalController.dismiss();
        } else {
          this.successfulClose();
        }
      }
      
      this.time = res.estimate_time;
      this.position = res.position;
      if (this.time > this.maxTime) {
        this.maxTime = this.time;
      } else {
        this.progress = (this.maxTime - this.time) / this.maxTime * 100;
      }
    }, err => {
      this.stopPoll();
      this.modalController.dismiss();
    });
  }
  stopPoll() {
    this.subs.unsubscribe();
  }
  close() {
    this.subs.sink = this.uploadService.setJobSilentAlert(this.jobUuid, false).subscribe(res => {
      this.modalController.dismiss();
    });
  }

  successfulClose() {
    this.subs.sink = this.projectService.getCollections(this.projectId).subscribe(col => {
      this.modalController.dismiss({
        collections: col,
      });
    });
  }

  download(url) {
    const link =  document.createElement('a');
    // link.setAttribute('target', '_blank');
    link.setAttribute('href', url);
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  getSuffix(num: number) {
    const digit = num % 10;
    if (digit == 1) { return 'st'; }
    if (digit == 2) { return 'nd'; }
    if (digit == 3) { return 'rd'; }
    return 'th';
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
