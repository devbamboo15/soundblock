import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpEventType, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { BehaviorSubject, Observable, of, Subscription, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class UploadService {

  // Manage Uploading Files
  files: any;
  steps = [];
  stepIndex = 0;
  changes: any;
  discards: any;
  isZip = 0;

  // Upload Zip
  uploadSub: Subscription;
  progress: number;
  uploadFailed: boolean;
  fileName: any;

  queue: any;
  reqTemp: any;

  constructor(
    private http: HttpClient,
  ) {
    this.initUploadStatus();
  }

  initUploadStatus() {
    this.progress = 0;
    this.uploadFailed = false;
  }

  initFilesStatus() {
    this.changes = {
      music: [],
      video: [],
      merch: [],
      other: [],
    };
    this.discards = {
      music: [],
      video: [],
      merch: [],
      other: [],
    };
    this.steps = [];
    this.files = [];
  }

  setSteps(curTab) {
    this.steps = [];
    if (this.files.video.length > 0) { this.steps.push('Video'); }
    if (this.files.merch.length > 0) { this.steps.push('Merch'); }
    if (this.files.other.length > 0) { this.steps.push('Other'); }
    const index = this.steps.findIndex(x => x == curTab);
    if (index != -1) {
      [this.steps[0], this.steps[index]] = [this.steps[index], this.steps[0]];
    }
    if (this.files.music.length > 0) { this.steps.unshift('Music'); }
    this.stepIndex = 1;
  }

  doneCurStep() {
    this.steps.shift();
    this.stepIndex ++;
  }

  get curStep() {
    return this.steps[0];
  }

  get filesArr() {
    const arr = [...this.files.music, ...this.files.video, ...this.files.merch, ...this.files.other];
    return arr;
  }
  uploadCollectionFile(project, comment, file, path, tab) {
    this.reqTemp = {project, comment, file, path, tab};
    const formData = new FormData();
    formData.append('project', project);
    formData.append('file', file);
    formData.append('collection_comment', comment);
    formData.append('file_path', path);
    formData.append('file_category', tab);

    this.initUploadStatus();
    this.uploadSub = this.http.post<any>(`soundblock/project/collection/file`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(map((event: HttpEvent<any>) => {
      switch (event.type) {
        case HttpEventType.UploadProgress:
          this.progress = Math.round(event.loaded * 100 / event.total);
          break;
        case HttpEventType.Response:
          return event.body;
      }
    }), catchError((error: HttpErrorResponse) => {
      this.uploadFailed = true;
      console.log({error});
      this.cancelUpload();
      return throwError(error);
    })).subscribe(response => {
      if (response) {
        this.fileName = response.data;
      }
    }, err => {
      console.log({err});
    });
  }

  uploadCollectionFileConfirm(project, files, comment, fileName) {
    const req = {project, collection_comment: comment, files, is_zip: this.isZip, file_name: fileName};
    return this.http.post<any>(`soundblock/project/collection/confirm`, req).pipe(map(res => {
      return res.data;
    }));
  }

  uploadAgain() {
    this.uploadSub.unsubscribe();
    this.uploadCollectionFile(this.reqTemp.project, this.reqTemp.comment, this.reqTemp.file, this.reqTemp.path, this.reqTemp.tab);
  }

  cancelUpload() {
    this.uploadSub.unsubscribe();
  }

  downloadFileFromUrl(url) {
    return this.http.get(url, {responseType: 'arraybuffer'});
  }

  getJobStatus(jobUuid) {
    return this.http.get<any>(`job/${jobUuid}/status`).pipe(map(res => {
      console.log({res});
      return res.data;
    }));
  }

  setJobSilentAlert(jobUuid, isSilent) {
    const req = {
      job: jobUuid,
      flag_silentalert: isSilent ? 1 : 0,
    };
    return this.http.patch<any>(`job`, req);
  }
}
