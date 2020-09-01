import { Component, OnInit, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AlertDialogComponent } from 'src/app/components/common/alert-dialog/alert-dialog.component';
import { SharedService } from 'src/app/services/shared/shared';
import { AuthService } from 'src/app/services/account/auth';
import { SubSink } from 'subsink';

import { environment } from 'src/environments/local';

@Component({
  selector: 'app-security',
  templateUrl: './security.component.html',
  styleUrls: ['./security.component.scss'],
})
export class SecurityComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  curPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordStrength = '';
  validCurrentPassword = -1;

  cloudUrl = environment.cloudUrl;

  showPass = false;

  qrData: any;
  authCode = '';
  enabled = false;
  
  constructor(
    private authService: AuthService,
    private sharedService: SharedService,
    private modalController: ModalController,
  ) { }

  ngOnInit() {
    this.get2faSecrets();
  }

  checkCurrentPassword() {
    this.subs.sink = this.authService.checkPassword(this.curPassword).subscribe(res => {
      this.validCurrentPassword = res.data;
    });
  }

  changePassword() {
    this.subs.sink = this.authService.resetPassword(this.newPassword, this.confirmPassword).subscribe(res => {
      this.showMessage();
    });
  }

  changeNewPassword() {
    this.passwordStrength = this.sharedService.checkPasswordStrength(this.newPassword);
  }

  checkPasswordMatch() {

  }

  showPassword() {
    this.showPass = !this.showPass;
  }

  async showMessage() {
    const modal = await this.modalController.create({
      component: AlertDialogComponent,
      componentProps: {
        title: 'Reset Password',
        message: 'Your password has been reset',
        description: 'You can now sign in with your new password'
      }
    });
    return await modal.present();
  }

  get2faSecrets() {
    this.subs.sink = this.authService.get2faSecrets().subscribe(res => {
      this.qrData = res;
      this.enabled = res.enabled;
    });
  }

  enable2fa() {
    this.subs.sink = this.authService.enable2fa(this.authCode).subscribe(res => {
      this.get2faSecrets();
    });
  }

  disable2fa() {
    this.subs.sink = this.authService.disable2fa().subscribe(res => {
      this.get2faSecrets();
    });
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
